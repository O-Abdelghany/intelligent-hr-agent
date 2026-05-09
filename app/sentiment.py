from transformers import pipeline

class SentimentAnalyzer:
    def __init__(self):
        # model trained to detect emotion/sentiment
        self.analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

    def analyze(self, text):
        """
        Analyzes the sentiment of the given text.
        Returns: {'label': 'POSITIVE' or 'NEGATIVE', 'score': float}
        """
        # Truncate text to model's max token limit
        result = self.analyzer(text[:512])
        return result[0]