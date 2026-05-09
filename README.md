# HR Agent

An AI-powered HR assistant with a full-stack web interface. It does two things:

1. **Resume Matching** — parses PDF resumes, embeds them into a vector database, and ranks the top candidates for a given job description using semantic search (RAG).
2. **Employee Sentiment Analysis** — analyzes employee feedback and classifies it as positive or negative using a fine-tuned DistilBERT model.

---

## How It Works

```
PDF Resumes
    │
    ▼
parser.py  ──► extract text from PDFs
    │
    ▼
embedder.py ──► convert text to vector embeddings (all-MiniLM-L6-v2)
    │
    ▼
vectordb.py ──► store embeddings in ChromaDB (persistent local storage)
    │
    ▼
rag.py ──► embed job description → query ChromaDB → return top matches

sentiment.py ──► analyze employee feedback with DistilBERT
    │
    ▼
backend/main.py ──► FastAPI exposes all of the above as REST endpoints
    │
    ▼
frontend/ ──► React + Vite UI consumes the API
```

---

## Project Structure

```
hr-agent/
├── app/
│   ├── main.py          # CLI entry point (optional)
│   ├── parser.py        # PDF text extraction
│   ├── embedder.py      # Sentence embeddings (SentenceTransformers)
│   ├── vectordb.py      # ChromaDB wrapper
│   ├── rag.py           # Candidate matching logic
│   ├── sentiment.py     # Sentiment analysis
│   └── data/
│       ├── resumes/             # Put your PDF resumes here
│       └── job_description/
│           └── job.txt          # Default job description
├── backend/
│   └── main.py          # FastAPI app — wraps app/ modules as REST endpoints
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MatcherPage.tsx    # Candidate matching UI
│   │   │   └── SentimentPage.tsx  # Sentiment analysis UI
│   │   ├── components/
│   │   │   ├── ScoreBar.tsx
│   │   │   └── Spinner.tsx
│   │   ├── api.ts           # Axios API client
│   │   └── App.tsx          # Router + nav
│   ├── package.json
│   └── vite.config.ts
├── requirements.txt
└── README.md
```

---

## Setup

### Prerequisites

- Python 3.9+
- Node.js 18+

### 1. Clone the repo

```bash
git clone https://github.com/your-username/hr-agent.git
cd hr-agent
```

### 2. Python environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

> First run downloads `all-MiniLM-L6-v2` and `distilbert-base-uncased-finetuned-sst-2-english` (~100MB total). This happens automatically.

### 3. Frontend dependencies

```bash
cd frontend
npm install
```

---

## Running the App

You need two terminals running at the same time.

**Terminal 1 — FastAPI backend** (from `hr-agent/`):

```bash
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 — React frontend** (from `hr-agent/frontend/`):

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## API Endpoints

The backend runs at `http://localhost:8000`. Interactive docs available at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/resumes/count` | Number of PDFs in the local resumes folder |
| `POST` | `/resumes/index-local` | Index all PDFs from `app/data/resumes/` |
| `POST` | `/resumes/upload` | Upload and index PDF resumes from the browser |
| `POST` | `/match` | Find top N candidates for a job description |
| `POST` | `/sentiment` | Analyze sentiment for a list of feedback strings |

---

## Models Used

| Model | Purpose | Source |
|-------|---------|--------|
| `all-MiniLM-L6-v2` | Text embeddings for resume/JD matching | [Sentence Transformers](https://www.sbert.net/) |
| `distilbert-base-uncased-finetuned-sst-2-english` | Sentiment classification | [Hugging Face](https://huggingface.co/distilbert-base-uncased-finetuned-sst-2-english) |

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — REST API
- [ChromaDB](https://www.trychroma.com/) — local vector database
- [Sentence Transformers](https://www.sbert.net/) — semantic embeddings
- [Hugging Face Transformers](https://huggingface.co/transformers/) — sentiment model
- [pypdf](https://pypdf.readthedocs.io/) — PDF parsing

**Frontend**
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — build tool
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [React Router](https://reactrouter.com/) — client-side routing
- [Axios](https://axios-http.com/) — HTTP client

---

## Known Limitations

- Sentiment analysis only supports **binary** classification (positive/negative). Neutral or mixed feedback won't be detected accurately.
- Resume matching quality depends on how well the job description is written — vague descriptions give vague results.
- ChromaDB is stored locally in `app/chroma_db/`. To re-index from scratch, delete that folder and rerun.

---

## What's Next (Potential Improvements)

- [ ] Support more sentiment labels (neutral, mixed)
- [ ] Export matched candidates to CSV
- [ ] Batch embedding for faster indexing of large resume sets
- [ ] Add a config file for model names, paths, and result count
- [ ] Dockerize the full stack for easy deployment
