import chromadb

class ResumeVectorDB:
    def __init__(self):
        # Saves the database to a folder called "chroma_db" in your project
        self.client = chromadb.PersistentClient(path="./chroma_db")
        # Create or get the collection named "resumes"
        self.collection = self.client.get_or_create_collection(name="resumes")

    def add_resume(self, resume_id, text, embedding):
        """Adds or updates a resume in the database (upsert to avoid duplicate ID errors)."""
        self.collection.upsert(
            documents=[text],
            embeddings=[embedding],
            ids=[resume_id],
            metadatas=[{"filename": resume_id}]
        )

    def search_candidates(self, query_embedding, n_results=3):
        """Finds the top N resumes that match the job description embedding."""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        return results