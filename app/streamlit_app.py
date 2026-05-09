import sys
import os

# Ensure the app directory is on the path so local modules resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st
from parser import extract_text_from_pdf, load_resumes
from rag import CandidateMatcher
from sentiment import SentimentAnalyzer

# ── Page config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="HR Agent",
    page_icon="🤖",
    layout="wide",
)

# ── Cached model loading (only runs once per session) ──────────────────────────
@st.cache_resource(show_spinner="Loading AI models...")
def load_matcher():
    return CandidateMatcher()

@st.cache_resource(show_spinner="Loading sentiment model...")
def load_analyzer():
    return SentimentAnalyzer()

matcher = load_matcher()
analyzer = load_analyzer()

# ── Sidebar ────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.title("🤖 HR Agent")
    st.caption("AI-powered resume matching & sentiment analysis")
    st.divider()

    st.subheader("📂 Resume Library")
    uploaded_files = st.file_uploader(
        "Upload PDF resumes",
        type=["pdf"],
        accept_multiple_files=True,
        help="Upload one or more PDF resumes to index them into the vector database.",
    )

    if uploaded_files:
        if st.button("Index Uploaded Resumes", type="primary", use_container_width=True):
            resumes = []
            errors = []
            progress = st.progress(0, text="Parsing resumes...")

            for i, uploaded_file in enumerate(uploaded_files):
                try:
                    from pypdf import PdfReader
                    import io
                    reader = PdfReader(io.BytesIO(uploaded_file.read()))
                    text = "\n".join(
                        page.extract_text() for page in reader.pages if page.extract_text()
                    )
                    if text.strip():
                        resumes.append({"id": uploaded_file.name, "text": text})
                    else:
                        errors.append(uploaded_file.name)
                except Exception as e:
                    errors.append(f"{uploaded_file.name} ({e})")

                progress.progress((i + 1) / len(uploaded_files), text=f"Parsing {uploaded_file.name}...")

            if resumes:
                with st.spinner(f"Indexing {len(resumes)} resumes into vector DB..."):
                    matcher.index_resumes(resumes)
                st.success(f"✅ Indexed {len(resumes)} resume(s)")

            if errors:
                st.warning(f"⚠️ Skipped {len(errors)} file(s): {', '.join(errors)}")

            progress.empty()

    st.divider()

    # Load from local data folder if it exists
    DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "resumes")
    if os.path.exists(DATA_DIR):
        pdf_count = len([f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")])
        st.info(f"📁 Local resume folder: **{pdf_count} PDFs** found")
        if st.button("Index Local Resumes", use_container_width=True):
            with st.spinner(f"Parsing and indexing {pdf_count} resumes..."):
                resumes = load_resumes(DATA_DIR)
                matcher.index_resumes(resumes)
            st.success(f"✅ Indexed {len(resumes)} resume(s) from local folder")

# ── Main tabs ──────────────────────────────────────────────────────────────────
tab1, tab2 = st.tabs(["🔍 Candidate Matching", "💬 Sentiment Analysis"])

# ── Tab 1: Candidate Matching ──────────────────────────────────────────────────
with tab1:
    st.header("Find the Best Candidates")
    st.caption("Paste a job description below and the agent will rank the most relevant resumes using semantic search.")

    col1, col2 = st.columns([3, 1])

    with col1:
        # Pre-fill from job.txt if it exists
        JOB_FILE = os.path.join(os.path.dirname(__file__), "data", "job_description", "job.txt")
        default_jd = ""
        if os.path.exists(JOB_FILE):
            with open(JOB_FILE, "r") as f:
                default_jd = f.read()

        job_description = st.text_area(
            "Job Description",
            value=default_jd,
            height=280,
            placeholder="Paste the job description here...",
        )

    with col2:
        st.markdown("#### Options")
        n_results = st.slider("Top N candidates", min_value=1, max_value=10, value=3)
        st.markdown("&nbsp;")
        search_btn = st.button("🔍 Find Candidates", type="primary", use_container_width=True)

    if search_btn:
        if not job_description.strip():
            st.warning("Please enter a job description first.")
        else:
            with st.spinner("Searching for best matches..."):
                try:
                    # Temporarily patch n_results into the db call
                    original_search = matcher.db.search_candidates
                    matcher.db.search_candidates = lambda emb: original_search(emb, n_results=n_results)
                    results = matcher.find_matches(job_description)
                    matcher.db.search_candidates = original_search
                except Exception as e:
                    st.error(f"Search failed: {e}")
                    results = []

            if results:
                st.subheader(f"Top {len(results)} Candidates")
                st.divider()

                for rank, res in enumerate(results, start=1):
                    score = res["score"]
                    # Color the score: green > 0.7, yellow > 0.5, red otherwise
                    if score >= 0.7:
                        badge = "🟢"
                    elif score >= 0.5:
                        badge = "🟡"
                    else:
                        badge = "🔴"

                    with st.expander(
                        f"#{rank}  {badge}  {res['filename']}  —  {score:.0%} match",
                        expanded=(rank == 1),
                    ):
                        st.progress(min(score, 1.0), text=f"Similarity score: {score:.2%}")
                        st.markdown("**Resume Preview:**")
                        st.caption(res["preview"])
            else:
                st.info("No results found. Make sure resumes are indexed first (use the sidebar).")

# ── Tab 2: Sentiment Analysis ──────────────────────────────────────────────────
with tab2:
    st.header("Employee Sentiment Analysis")
    st.caption("Analyze employee feedback to understand morale. Enter one piece of feedback per line.")

    feedback_input = st.text_area(
        "Employee Feedback",
        height=200,
        placeholder="I love working here, the environment is great!\nThe management is terrible and I am very stressed.\nThe salary is okay but the hours are long.",
    )

    analyze_btn = st.button("💬 Analyze Sentiment", type="primary")

    if analyze_btn:
        lines = [line.strip() for line in feedback_input.strip().splitlines() if line.strip()]

        if not lines:
            st.warning("Please enter at least one line of feedback.")
        else:
            st.subheader("Results")
            st.divider()

            positive_count = 0
            negative_count = 0

            for line in lines:
                with st.spinner(f'Analyzing: "{line[:60]}..."'):
                    result = analyzer.analyze(line)

                label = result["label"]
                score = result["score"]

                if label == "POSITIVE":
                    positive_count += 1
                    icon = "😊"
                    color = "green"
                else:
                    negative_count += 1
                    icon = "😟"
                    color = "red"

                col_text, col_label, col_score = st.columns([5, 1, 1])
                with col_text:
                    st.markdown(f"_{line}_")
                with col_label:
                    st.markdown(f":{color}[**{icon} {label}**]")
                with col_score:
                    st.markdown(f"`{score:.0%}`")
                st.divider()

            # Summary metrics
            total = len(lines)
            st.subheader("Summary")
            m1, m2, m3 = st.columns(3)
            m1.metric("Total Responses", total)
            m2.metric("Positive 😊", positive_count, delta=f"{positive_count/total:.0%}")
            m3.metric("Negative 😟", negative_count, delta=f"-{negative_count/total:.0%}", delta_color="inverse")
