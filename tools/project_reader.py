import os
import sys
import json
import fnmatch
from pathlib import Path

SKIP_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next', '.cache'}
CODE_EXTS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json', '.md', '.java', '.cpp', '.c', '.h', '.go', '.rs', '.rb', '.php', '.sh', '.bat', '.yaml', '.yml', '.toml', '.xml', '.sql'}

def parse_gitignore(root_path):
    patterns = set(SKIP_DIRS)
    gitignore_path = os.path.join(root_path, '.gitignore')
    if os.path.exists(gitignore_path):
        try:
            with open(gitignore_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        patterns.add(line)
        except Exception:
            pass
    return patterns

def is_ignored(name, patterns):
    for pat in patterns:
        p = pat.rstrip('/')
        if p == name or fnmatch.fnmatch(name, p):
            return True
        if p.startswith('**/') and fnmatch.fnmatch(name, p[3:]):
            return True
        if p.startswith('*') and fnmatch.fnmatch(name, p):
            return True
    return False

def guess_architecture(root_path, files):
    has_package_json = 'package.json' in files
    has_requirements = any(f in files for f in ['requirements.txt', 'Pipfile', 'pyproject.toml'])
    has_pom = 'pom.xml' in files
    has_gradle = 'build.gradle' in files
    has_go_mod = 'go.mod' in files
    has_cargo = 'Cargo.toml' in files

    parts = []
    
    if has_package_json:
        try:
            with open(os.path.join(root_path, 'package.json'), 'r', encoding='utf-8') as f:
                content = f.read().lower()
                if '"react"' in content or '"next"' in content:
                    parts.append("React frontend")
                elif '"vue"' in content or '"nuxt"' in content:
                    parts.append("Vue frontend")
                elif '"@angular' in content:
                    parts.append("Angular frontend")
                elif '"svelte"' in content:
                    parts.append("Svelte frontend")
                elif '"express"' in content:
                    parts.append("Node.js/Express backend")
                else:
                    parts.append("Node.js/JS project")
        except:
            parts.append("Node.js/JS project")
            
    if has_requirements:
        parts.append("Python backend" if parts else "Python project")
    if has_pom or has_gradle:
        parts.append("Java backend" if parts else "Java project")
    if has_go_mod:
        parts.append("Go backend" if parts else "Go project")
    if has_cargo:
        parts.append("Rust backend" if parts else "Rust project")
        
    if not parts:
        return "Generic/Unknown Architecture"
    
    return " with ".join(parts)

def scan_project(root_path, current_path=None, ignore_patterns=None, prefix='', depth=0, max_depth=5):
    if current_path is None:
        current_path = root_path
    if ignore_patterns is None:
        ignore_patterns = parse_gitignore(root_path)

    lines = []
    try:
        entries = sorted(os.listdir(current_path))
    except PermissionError:
        return ['[Permission Denied]']
    
    dirs = []
    files = []
    for e in entries:
        if is_ignored(e, ignore_patterns) or e.startswith('.'):
            continue
            
        full = os.path.join(current_path, e)
        if os.path.isdir(full):
            dirs.append(e)
        else:
            files.append(e)
    
    for f in files:
        ext = Path(f).suffix.lower()
        size = os.path.getsize(os.path.join(current_path, f))
        size_str = f"{size}B" if size < 1024 else f"{round(size/1024, 1)}KB"
        marker = ' [CODE]' if ext in CODE_EXTS else ''
        lines.append(f"{prefix}{f} ({size_str}){marker}")
    
    for d in dirs:
        lines.append(f"{prefix}{d}/")
        if depth < max_depth:
            sub = scan_project(root_path, os.path.join(current_path, d), ignore_patterns, prefix + '  ', depth + 1, max_depth)
            lines.extend(sub)
    
    return lines

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
        if not os.path.isdir(target):
            print(json.dumps({"error": f"Not a directory: {target}"}))
            sys.exit(1)
            
        # Architecture detection
        try:
            root_files = [f for f in os.listdir(target) if os.path.isfile(os.path.join(target, f))]
        except:
            root_files = []
            
        architecture = guess_architecture(target, root_files)
        
        # Scan tree
        tree = scan_project(target)
        output = '\n'.join(tree[:200])  # Cap at 200 lines
        
        print(json.dumps({
            "ok": True,
            "architecture": architecture,
            "tree": output, 
            "total_items": len(tree)
        }))
    else:
        print(json.dumps({"error": "Usage: project_reader.py <path>"}))
