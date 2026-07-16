import os
import json
import sys
import hashlib
from datetime import datetime
from pathlib import Path

def inspect_file(file_path):
    path = Path(file_path)
    if not path.exists() or not path.is_file():
        print(json.dumps({"error": f"File not found: {file_path}"}))
        return

    try:
        stat = path.stat()
        
        # Calculate SHA-256
        sha256_hash = hashlib.sha256()
        with open(path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
                
        info = {
            "ok": True,
            "name": path.name,
            "location": str(path.parent),
            "size_bytes": stat.st_size,
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "extension": path.suffix,
            "sha256": sha256_hash.hexdigest()
        }
        print(json.dumps(info))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        inspect_file(sys.argv[1])
    else:
        print(json.dumps({"error": "Usage: inspector.py <file_path>"}))
