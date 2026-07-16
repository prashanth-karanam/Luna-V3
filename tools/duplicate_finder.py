import os
import json
import sys
import hashlib
import time
from collections import defaultdict
from pathlib import Path

def print_progress(msg):
    print(json.dumps({"type": "progress", "msg": msg}))
    sys.stdout.flush()

def get_file_hash(path):
    hash_md5 = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def find_duplicates(search_dir):
    search_path = Path(search_dir)
    if not search_path.exists() or not search_path.is_dir():
        print(json.dumps({"error": f"Directory not found: {search_dir}"}))
        return

    size_groups = defaultdict(list)
    try:
        print_progress(f"Step 1: Mapping file sizes in {search_dir}...")
        files_mapped = 0
        last_update = time.time()
        
        for root, dirs, files in os.walk(search_path):
            for file in files:
                full_path = Path(root) / file
                try:
                    size = full_path.stat().st_size
                    if size > 0:
                        size_groups[size].append(full_path)
                        files_mapped += 1
                        
                        if time.time() - last_update > 0.5:
                            print_progress(f"Mapped {files_mapped} files by size...")
                            last_update = time.time()
                except Exception:
                    pass

        # Filter out sizes that only have 1 file (can't be duplicates)
        suspect_sizes = {s: p for s, p in size_groups.items() if len(p) > 1}
        total_suspects = sum(len(p) for p in suspect_sizes.values())
        print_progress(f"Step 2: Found {total_suspects} potential duplicates. Hashing files...")

        duplicates = []
        hashes_computed = 0
        last_update = time.time()
        
        for size, paths in suspect_sizes.items():
            hash_groups = defaultdict(list)
            for path in paths:
                try:
                    f_hash = get_file_hash(path)
                    hash_groups[f_hash].append(str(path))
                    hashes_computed += 1
                    
                    if time.time() - last_update > 0.5:
                        perc = int((hashes_computed / total_suspects) * 100)
                        print_progress(f"Hashing files... {perc}% ({hashes_computed}/{total_suspects})")
                        last_update = time.time()
                except Exception:
                    pass
            
            for f_hash, identical_paths in hash_groups.items():
                if len(identical_paths) > 1:
                    duplicates.append({
                        "hash": f_hash,
                        "size_bytes": size,
                        "files": identical_paths
                    })
                    
        total_dupes = sum(len(d['files']) for d in duplicates)
        print_progress(f"Scan complete. Confirmed {total_dupes} duplicate files.")
        
        print(json.dumps({
            "ok": True,
            "duplicate_groups": len(duplicates),
            "total_duplicate_files": total_dupes,
            "results": duplicates[:20]  # Return top 20 groups
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        find_duplicates(sys.argv[1])
    else:
        print(json.dumps({"error": "Usage: duplicate_finder.py <directory>"}))
