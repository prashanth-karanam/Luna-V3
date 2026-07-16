import os
import json
import sys
import time
import subprocess
from pathlib import Path

def print_progress(msg):
    print(json.dumps({"type": "progress", "msg": msg}))
    sys.stdout.flush()

def _format_stat(path_str):
    try:
        stat = os.stat(path_str)
        return {
            "name": os.path.basename(path_str),
            "path": path_str,
            "size_bytes": stat.st_size,
            "modified": stat.st_mtime
        }
    except Exception:
        return {
            "name": os.path.basename(path_str),
            "path": path_str,
            "size_bytes": 0,
            "modified": 0
        }

def search_everything(query, search_dir):
    try:
        abs_dir = os.path.abspath(search_dir)
        # Check if es.exe is in PATH
        result = subprocess.run(['es.exe', '-n', '50', f'*{query}*', abs_dir], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            results = []
            for line in lines:
                if line.strip():
                    results.append(_format_stat(line.strip()))
            return results
    except Exception:
        pass
    return None

def search_windows_index(query, search_dir):
    try:
        import win32com.client
        conn = win32com.client.Dispatch("ADODB.Connection")
        conn.Open("Provider=Search.CollatorDSO;Extended Properties='Application=Windows';")
        rs = win32com.client.Dispatch("ADODB.Recordset")
        
        safe_query = query.replace("'", "''")
        abs_dir = os.path.abspath(search_dir)
        safe_dir = abs_dir.replace("'", "''").replace("\\", "/")
        
        sql = f"SELECT TOP 50 System.ItemPathDisplay FROM SystemIndex WHERE System.FileName LIKE '%{safe_query}%' AND scope='file:{safe_dir}'"
        rs.Open(sql, conn)
        
        results = []
        while not rs.EOF:
            path_val = rs.Fields.Item("System.ItemPathDisplay").Value
            if path_val:
                results.append(_format_stat(str(path_val)))
            rs.MoveNext()
        
        rs.Close()
        conn.Close()
        return results
    except Exception:
        return None

def search_files(query, search_dir):
    search_path = Path(search_dir)
    if not search_path.exists() or not search_path.is_dir():
        print(json.dumps({"error": f"Directory not found: {search_dir}"}))
        return
        
    abs_dir = str(search_path.absolute())

    # Try Everything CLI
    print_progress("Attempting search via Voidtools Everything (es.exe)...")
    results = search_everything(query, abs_dir)
    if results is not None:
        print_progress("Everything search successful.")
        print(json.dumps({"ok": True, "matches": len(results), "scanned": -1, "results": results, "method": "Everything CLI"}))
        return

    # Try Windows Search Index
    print_progress("Attempting search via Windows Search Index (win32com)...")
    results = search_windows_index(query, abs_dir)
    if results is not None:
        print_progress("Windows Index search successful.")
        print(json.dumps({"ok": True, "matches": len(results), "scanned": -1, "results": results, "method": "Windows Search Index"}))
        return

    print_progress("Falling back to os.walk...")
    results = []
    query = query.lower()
    files_scanned = 0
    last_update = time.time()

    try:
        # Walk recursively
        for root, dirs, files in os.walk(search_path):
            if time.time() - last_update > 0.5:
                print_progress(f"Scanning directory: {root} ({files_scanned} files checked)")
                last_update = time.time()
                
            for file in files:
                files_scanned += 1
                if query in file.lower():
                    full_path = Path(root) / file
                    try:
                        stat = full_path.stat()
                        results.append({
                            "name": file,
                            "path": str(full_path),
                            "size_bytes": stat.st_size,
                            "modified": stat.st_mtime
                        })
                        print_progress(f"Found match: {file}")
                    except Exception:
                        pass
                
                # Limit to 50 results to avoid massive JSON dumps
                if len(results) >= 50:
                    break
            if len(results) >= 50:
                print_progress("Reached 50 matches. Stopping search early to prevent overload.")
                break

        print(json.dumps({"ok": True, "matches": len(results), "scanned": files_scanned, "results": results, "method": "os.walk"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 2:
        search_files(sys.argv[1], sys.argv[2])
    else:
        print(json.dumps({"error": "Usage: search.py <query> <directory>"}))
