import os
from pypdf import PdfReader

def extract_text_from_pdf(pdf_path):
    """Reads a PDF file and returns the text content."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error parsing {pdf_path}: {e}")
        return ""

def load_resumes(directory_path):
    """
    Loops through the resume folder and returns a list of dictionaries:
    [{'id': 'filename', 'text': 'resume content...'}, ...]
    """
    resumes = []
    for filename in os.listdir(directory_path):
        if filename.endswith(".pdf"):
            file_path = os.path.join(directory_path, filename)
            text = extract_text_from_pdf(file_path)
            if text:
                resumes.append({"id": filename, "text": text})
    return resumes