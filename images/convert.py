import os
from PIL import Image

def convert_to_webp(folder_path):
    print(f"Checking in {folder_path}...")
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(".png") or filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
            file_path = os.path.join(folder_path, filename)
            webp_path = os.path.join(folder_path, os.path.splitext(filename)[0] + ".webp")
            
            # Skip if already exists
            if os.path.exists(webp_path):
                print(f"Skipping {filename}, already exists")
                continue
                
            try:
                img = Image.open(file_path)
                img.save(webp_path, "webp", quality=85)
                print(f"Converted {filename} to .webp")
                
                # Close the image so we can delete the old file
                img.close()
                os.remove(file_path)
                print(f"Deleted old file {filename}")
            except Exception as e:
                print(f"Error converting {filename}: {e}")

if __name__ == "__main__":
    import sys
    folder = sys.argv[1] if len(sys.argv) > 1 else "."
    convert_to_webp(folder)
