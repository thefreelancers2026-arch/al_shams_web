import os
import json
from PIL import Image

# Convert all images in images/catalogue/ to webp
IMG_DIR = "images/catalogue"
CATALOG_JSON = "data/catalog.json"

print(f"Converting images in {IMG_DIR} to WebP...")
converted = 0
skipped = 0

for filename in sorted(os.listdir(IMG_DIR)):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        old_path = os.path.join(IMG_DIR, filename)
        new_name = os.path.splitext(filename)[0] + ".webp"
        new_path = os.path.join(IMG_DIR, new_name)
        
        if os.path.exists(new_path):
            os.remove(old_path)
            skipped += 1
            continue
        
        try:
            img = Image.open(old_path)
            img.save(new_path, "webp", quality=82)
            img.close()
            os.remove(old_path)
            print(f"  ✅ {filename} → {new_name}")
            converted += 1
        except Exception as e:
            print(f"  ❌ Error: {filename}: {e}")

print(f"\nConverted: {converted}, Already done: {skipped}")

# Update catalog.json paths to .webp
print("\nUpdating catalog.json image paths to .webp...")
with open(CATALOG_JSON, "r", encoding="utf-8") as f:
    catalog = json.load(f)

for item in catalog:
    img = item["image"]
    # Replace extension with .webp
    base = os.path.splitext(img)[0]
    item["image"] = base + ".webp"

with open(CATALOG_JSON, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=4, ensure_ascii=False)

print(f"✅ Updated {len(catalog)} items in catalog.json")
