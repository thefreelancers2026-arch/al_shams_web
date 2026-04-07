import sys
import subprocess

try:
    import fitz  # PyMuPDF
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf"])
    import fitz

pdf_path = "BRAVAT [1200X600]-[DC]_250908_153223.pdf"
doc = fitz.open(pdf_path)
print(f"Total pages: {len(doc)}")
for i in range(min(len(doc), 5)):
    page = doc.load_page(i)
    text = page.get_text()
    print(f"--- Page {i+1} ---")
    print(text.strip().replace('\n', ' ')[:150])

print("Extracting images from first few pages...")
for i in range(min(len(doc), 2)):
    page = doc.load_page(i)
    images = page.get_images(full=True)
    if images:
        print(f"Page {i+1} has {len(images)} images")
