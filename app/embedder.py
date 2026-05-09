from sentence_transformers import SentenceTransformer

class Embedder:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def get_embedding(self, text):
        """Converts a single string of text into a vector embedding."""
        return self.model.encode(text).tolist()