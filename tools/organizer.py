import os
import shutil
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

def print_progress(msg):
    print(json.dumps({"type": "progress", "msg": msg}))
    sys.stdout.flush()

def get_ollama_model():
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags")
        with urllib.request.urlopen(req, timeout=2) as response:
            data = json.loads(response.read().decode('utf-8'))
            models = data.get("models", [])
            if models:
                # Prioritize standard text models over vision if possible, but fallback to first
                for m in models:
                    if "vision" not in m.get("name", "").lower():
                        return m["name"]
                return models[0]["name"]
    except Exception:
        pass
    return None

def categorize_via_slm(filename, model, valid_categories):
    prompt = f"Categorize the following file based on its name. Categories: [{', '.join(valid_categories)}]. File name: '{filename}'. Only reply with the exact category name and nothing else."
    
    data = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.0
        }
    }
    
    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/generate",
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode('utf-8'))
            cat = result.get("response", "").strip()
            # Clean up potential punctuation
            cat = ''.join(c for c in cat if c.isalnum() or c.isspace()).strip()
            # Find closest match in valid_categories case-insensitively
            for valid in valid_categories:
                if cat.lower() == valid.lower():
                    return valid
    except Exception:
        pass
    return None

def organize_files(target_dir):
    target_path = Path(target_dir)
    if not target_path.exists() or not target_path.is_dir():
        print(json.dumps({"error": f"Directory not found: {target_dir}"}))
        return

    # Semantic categories for SLM
    SEMANTIC_CATEGORIES = ['Finance', 'Career', 'Work', 'Personal', 'Media', 'Code', 'Archives', 'Others']

    # Fallback categorization map
    FALLBACK_CATEGORIES = {
        'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
        'Documents': ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls', '.csv', '.ppt', '.pptx'],
        'Videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv'],
        'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
        'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz'],
        'Executables': ['.exe', '.msi', '.bat', '.sh'],
        'Code': ['.py', '.js', '.html', '.css', '.cpp', '.json']
    }

    undo_log = []
    moved_count = 0
    total_files = len([f for f in target_path.iterdir() if f.is_file()])
    
    if total_files == 0:
        print(json.dumps({"ok": True, "message": "No files found to organize."}))
        return

    model = get_ollama_model()
    if model:
        print_progress(f"Using SLM model '{model}' for semantic sorting.")
    else:
        print_progress("No local SLM found. Falling back to extension-based sorting.")

    try:
        print_progress(f"Found {total_files} files to organize in {target_dir}...")
        for file_path in target_path.iterdir():
            if file_path.is_file():
                ext = file_path.suffix.lower()
                dest_folder = None
                
                # Attempt Semantic Sorting
                if model:
                    dest_folder = categorize_via_slm(file_path.name, model, SEMANTIC_CATEGORIES)
                
                # Fallback to extension sorting
                if not dest_folder:
                    dest_folder = "Others"
                    for category, extensions in FALLBACK_CATEGORIES.items():
                        if ext in extensions:
                            dest_folder = category
                            break
                
                # Create category folder
                cat_dir = target_path / dest_folder
                cat_dir.mkdir(exist_ok=True)

                # Handle duplicates
                dest_path = cat_dir / file_path.name
                counter = 1
                while dest_path.exists():
                    dest_path = cat_dir / f"{file_path.stem}_{counter}{file_path.suffix}"
                    counter += 1

                # Move file
                shutil.move(str(file_path), str(dest_path))
                
                # Log for undo
                undo_log.append({
                    "original": str(file_path),
                    "new": str(dest_path)
                })
                moved_count += 1
                
                if moved_count % 5 == 0 or moved_count == total_files:
                    perc = int((moved_count / total_files) * 100)
                    print_progress(f"Organizing files... {perc}% complete ({moved_count}/{total_files})")

        # Save undo log
        if undo_log:
            with open(target_path / "undo_organize.json", "w") as f:
                json.dump(undo_log, f, indent=4)
            print_progress("Generated undo_organize.json log.")

        print(json.dumps({
            "ok": True, 
            "moved": moved_count, 
            "message": f"Organized {moved_count} files in {target_dir}. Use [UNDO_ORGANIZE] to revert."
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        organize_files(sys.argv[1])
    else:
        print(json.dumps({"error": "Missing directory path"}))
