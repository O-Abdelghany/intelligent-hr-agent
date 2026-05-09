# app/rag.py
from embedder import Embedder
from vectordb import ResumeVectorDB

class CandidateMatcher:
    def __init__(self):
        self.embedder = Embedder()
        self.db = ResumeVectorDB()

    def index_resumes(self, resumes_data):
        """Takes parsed resume text and saves embeddings to ChromaDB."""
        print(f"Indexing {len(resumes_data)} resumes...")
        for resume in resumes_data:
            embedding = self.embedder.get_embedding(resume['text'])
            self.db.add_resume(resume['id'], resume['text'], embedding)
        print("Indexing complete.")

    def find_matches(self, job_description_text):
        """
        Embeds the job description and searches ChromaDB for similar resumes.
        Returns a list of matches with filename, similarity score, and a text preview.
        """
        query_embedding = self.embedder.get_embedding(job_description_text)
        results = self.db.search_candidates(query_embedding)
        
        # Format the output nicely
        matches = []
        ids = results['ids'][0]
        distances = results['distances'][0] # Smaller distance = better match
        documents = results['documents'][0]

        for i in range(len(ids)):
            matches.append({
                "filename": ids[i],
                "score": 1 - distances[i], # Convert distance to similarity score approx
                "preview": documents[i][:200] + "..." # Show first 200 chars
            })
        
        return matches