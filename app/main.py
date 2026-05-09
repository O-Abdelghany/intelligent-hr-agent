import os
from parser import load_resumes
from rag import CandidateMatcher
from sentiment import SentimentAnalyzer

# Define paths
DATA_DIR = "./data/resumes"
JOB_DESC_FILE = "./data/job_description/job.txt"

def main():
    # PART 1: Candidate Matching (RAG/Vector Search)
    print("Starting Candidate Matching Process...")
    matcher = CandidateMatcher()
    
    # 1. Parse Resumes from folder
    if os.path.exists(DATA_DIR):
        resumes = load_resumes(DATA_DIR)
        
        # 2. Store them in Vector DB (Chroma)
        # Note: In a real app, you only run this once, not every time.
        matcher.index_resumes(resumes)
        
        # 3. Match against a Job Description
        print("\nEnter a Job Description (or press Enter to read from file):")
        user_input = input(">> ")
        
        if not user_input and os.path.exists(JOB_DESC_FILE):
             with open(JOB_DESC_FILE, 'r') as f:
                query = f.read()
        else:
            query = user_input if user_input else "Python Developer with AI skills"

        print(f"\nSearching for candidates matching: '{query[:50]}...'")
        results = matcher.find_matches(query)
        
        print("\nTop Candidates Found:")
        for res in results:
            print(f"- {res['filename']} (Score: {res['score']:.2f})")
    else:
        print("Please create a 'data/resumes' folder and put PDF files in it.")

    # PART 2: Employee Sentiment Analysis
    print("\nStarting Employee Sentiment Analysis")
    analyzer = SentimentAnalyzer()
    
    # sample feedback, we'd load this from a file too in the real app
    feedbacks = [
        "I love working here, the environment is great!",
        "The management is terrible and I am very stressed.",
        "The salary is okay but the hours are long."
    ]
    
    for feedback in feedbacks:
        result = analyzer.analyze(feedback)
        print(f"Feedback: '{feedback}'")
        print(f" -> Sentiment: {result['label']} (Confidence: {result['score']:.2f})\n")

if __name__ == "__main__":
    main()