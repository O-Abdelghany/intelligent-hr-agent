import sys
import os

# Make sure local app modules are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import io

from parser import extract_text_from_pdf, load_resumes
from rag import CandidateMatcher
from sentiment import SentimentAnalyzer

app = FastAPI(title="HR Agent API", version="1.0.0")

# Allow requests from the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Singletons (loaded once on startup) ───────────────────────────────────────
matcher = CandidateMatcher()
analyzer = SentimentAnalyzer()

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "app", "data", "resumes")


# ── Request / Response models ──────────────────────────────────────────────────
class MatchRequest(BaseModel):
    job_description: str
    n_results: int = 3


class MatchResult(BaseModel):
    filename: str
    score: float
    preview: str


class SentimentRequest(BaseModel):
    feedbacks: List[str]


class SentimentResult(BaseModel):
    text: str
    label: str
    score: float


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "HR Agent API is running"}


@app.get("/resumes/count")
def resume_count():
    """Returns how many PDFs are in the local resumes folder."""
    if not os.path.exists(DATA_DIR):
        return {"count": 0}
    count = len([f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")])
    return {"count": count}


@app.post("/resumes/index-local")
def index_local_resumes():
    """Indexes all PDFs from the local data/resumes folder into ChromaDB."""
    if not os.path.exists(DATA_DIR):
        raise HTTPException(status_code=404, detail="Local resumes folder not found.")
    resumes = load_resumes(DATA_DIR)
    if not resumes:
        raise HTTPException(status_code=400, detail="No valid PDFs found in the resumes folder.")
    matcher.index_resumes(resumes)
    return {"indexed": len(resumes)}


@app.post("/resumes/upload")
async def upload_resumes(files: List[UploadFile] = File(...)):
    """Accepts uploaded PDF files, parses them, and indexes them into ChromaDB."""
    resumes = []
    errors = []

    for file in files:
        if not file.filename.endswith(".pdf"):
            errors.append(f"{file.filename}: not a PDF")
            continue
        try:
            contents = await file.read()
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(contents))
            text = "\n".join(
                page.extract_text() for page in reader.pages if page.extract_text()
            )
            if text.strip():
                resumes.append({"id": file.filename, "text": text})
            else:
                errors.append(f"{file.filename}: no text extracted")
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")

    if resumes:
        matcher.index_resumes(resumes)

    return {"indexed": len(resumes), "errors": errors}


@app.post("/match", response_model=List[MatchResult])
def match_candidates(req: MatchRequest):
    """Finds the top N resumes matching the given job description."""
    if not req.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    # Temporarily override n_results
    original_search = matcher.db.search_candidates
    matcher.db.search_candidates = lambda emb: original_search(emb, n_results=req.n_results)
    try:
        results = matcher.find_matches(req.job_description)
    finally:
        matcher.db.search_candidates = original_search

    return results


@app.post("/sentiment", response_model=List[SentimentResult])
def analyze_sentiment(req: SentimentRequest):
    """Analyzes sentiment for a list of feedback strings."""
    if not req.feedbacks:
        raise HTTPException(status_code=400, detail="Feedbacks list cannot be empty.")

    results = []
    for text in req.feedbacks:
        if text.strip():
            result = analyzer.analyze(text)
            results.append({"text": text, "label": result["label"], "score": result["score"]})

    return results
