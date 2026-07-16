import os
import sys
import json
import subprocess
from pathlib import Path

SKIP_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next', '.cache'}
CODE_EXTS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json', '.md', '.java', '.cpp', '.c', '.h', '.go', '.rs', '.rb', '.php', '.sh', '.bat', '.yaml', '.yml', '.toml', '.xml', '.sql'}

def search_code_python(query, root_path):
    results = []
    
    for dirpath, dirnames, filenames in os.walk(root_path):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
        
        for fname in filenames:
            ext = Path(fname).suffix.lower()
            if ext not in CODE_EXTS:
                continue
            
            fpath = os.path.join(dirpath, fname)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    
                for i, line in enumerate(lines):
                    if query.lower() in line.lower():
                        # Get context
                        start_idx = max(0, i - 3)
                        end_idx = min(len(lines), i + 4)
                        
                        context_block = []
                        for j in range(start_idx, end_idx):
                            prefix = ":" if j == i else "-"
                            context_block.append(f"{fpath}{prefix}{j+1}{prefix} {lines[j].strip()[:120]}")
                        
                        results.append("\n".join(context_block))
                        
                        if len(results) >= 50:
                            break
            except (PermissionError, OSError):
                continue
            
            if len(results) >= 50:
                break
        
        if len(results) >= 50:
            break
            
    return "\n---\n".join(results), len(results)

def search_code_rg(query, root_path):
    # rg -i -F -C 3 -n "query" "root_path"
    try:
        # We limit output to avoid massive payloads, rg --max-count can limit matches per file,
        # but to limit total we might just truncate the string.
        result = subprocess.run(
            ['rg', '-i', '-F', '-C', '3', '-n', query, root_path],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        if result.returncode == 0:
            output = result.stdout
            # Truncate if too long (e.g. 50 matches could be ~200 lines)
            lines = output.split('\n')
            if len(lines) > 500:
                output = '\n'.join(lines[:500]) + "\n... (truncated)"
            
            # Count actual matches (lines with ':')
            count = sum(1 for line in lines if f"{query}" in line.lower() and (":" in line)) # Rough estimate
            # Actually better to just return a dummy count or let rg output speak for itself
            return output, -1
        elif result.returncode == 1:
            return "", 0 # No matches found
        else:
            return None, 0 # Error running rg (maybe not installed)
    except FileNotFoundError:
        return None, 0

def search_code(query, root_path):
    output, count = search_code_rg(query, root_path)
    if output is not None:
        return output, count
        
    # Fallback to Python
    return search_code_python(query, root_path)

if __name__ == "__main__":
    if len(sys.argv) > 2:
        query = sys.argv[1]
        path = sys.argv[2]
        if not os.path.isdir(path):
            print(json.dumps({"error": f"Not a directory: {path}"}))
            sys.exit(1)
        
        results, count = search_code(query, path)
        print(json.dumps({"ok": True, "results": results, "count": count if count != -1 else "unknown (rg used)"}))
    else:
        print(json.dumps({"error": "Usage: code_search.py <query> <path>"}))
