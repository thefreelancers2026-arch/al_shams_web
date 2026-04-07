import fitz
import os
import json
import re

PDF_PATH = "BRAVAT [1200X600]-[DC]_250908_153223.pdf"
OUTPUT_IMG_DIR = "images/catalogue"
OUTPUT_JSON = "data/catalog.json"

os.makedirs(OUTPUT_IMG_DIR, exist_ok=True)

doc = fitz.open(PDF_PATH)
print(f"Total pages: {len(doc)}")

catalog = []
img_index = 0
item_id = 1

for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    text = page.get_text().strip()
    images = page.get_images(full=True)

    print(f"\n=== PAGE {page_num + 1} ===")
    print(f"Text: {text[:300]}")
    print(f"Images count: {len(images)}")

    # Extract all images from this page
    for img_info in images:
        xref = img_info[0]
        base_image = doc.extract_image(xref)
        img_bytes = base_image["image"]
        img_ext = base_image["ext"]
        
        img_filename = f"tile_{item_id:03d}.{img_ext}"
        img_path = os.path.join(OUTPUT_IMG_DIR, img_filename)

        with open(img_path, "wb") as f:
            f.write(img_bytes)
        
        print(f"  Saved image: {img_filename} ({img_ext})")

        # Try to extract product info from page text
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        title = lines[0] if lines else f"Tile Design {item_id:03d}"
        category = "Premium Collection"

        # Guess type from text
        type_map = {"floor": "Floor", "wall": "Wall", "marble": "Marble", "designer": "Designer", "dc": "Designer"}
        detected_type = "Floor"
        for keyword, t in type_map.items():
            if keyword.lower() in text.lower() or keyword.lower() in PDF_PATH.lower():
                detected_type = t
                break

        # Try to extract size info
        size_match = re.search(r'(\d{3,4}[xX×]\d{3,4})', text + PDF_PATH)
        size = size_match.group(1).replace('×', 'x').replace('X', 'x') if size_match else "1200x600"

        catalog.append({
            "id": f"p{item_id:03d}",
            "title": title,
            "category": f"BRAVAT – {size}mm",
            "type": detected_type,
            "image": f"images/catalogue/{img_filename}",
            "size": size,
            "delay": f"{((item_id - 1) % 2) * 0.1}s"
        })

        item_id += 1

# Write catalog JSON
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=4, ensure_ascii=False)

print(f"\n✅ Done! Extracted {item_id - 1} products.")
print(f"📁 Images saved to: {OUTPUT_IMG_DIR}/")
print(f"📝 Catalog saved to: {OUTPUT_JSON}")
