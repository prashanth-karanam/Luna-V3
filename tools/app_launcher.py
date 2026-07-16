import os
import sys
import json
import subprocess
import winreg
import difflib
from pathlib import Path
import psutil
import ctypes
from ctypes import wintypes

def get_registry_apps():
    apps = {}
    keys_to_check = [
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"),
        (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths")
    ]
    for hkey, subkey in keys_to_check:
        try:
            with winreg.OpenKey(hkey, subkey) as key:
                i = 0
                while True:
                    try:
                        app_key_name = winreg.EnumKey(key, i)
                        with winreg.OpenKey(key, app_key_name) as app_key:
                            try:
                                app_path, _ = winreg.QueryValueEx(app_key, "")
                                if app_path:
                                    clean_name = app_key_name.lower().replace('.exe', '')
                                    apps[clean_name] = app_path
                            except FileNotFoundError:
                                pass
                        i += 1
                    except OSError:
                        break
        except FileNotFoundError:
            pass
    return apps

def get_start_menu_apps():
    apps = {}
    start_menu_paths = [
        Path(os.environ.get('APPDATA', '')) / r"Microsoft\Windows\Start Menu\Programs",
        Path(os.environ.get('PROGRAMDATA', '')) / r"Microsoft\Windows\Start Menu\Programs"
    ]
    for path in start_menu_paths:
        if not path.exists():
            continue
        try:
            for file in path.rglob('*'):
                if file.is_file() and file.suffix.lower() in ['.lnk', '.exe']:
                    clean_name = file.stem.lower()
                    apps[clean_name] = str(file)
        except Exception:
            pass
    return apps

def build_app_index():
    index = {}
    index.update(get_start_menu_apps())
    index.update(get_registry_apps())
    return index

def find_best_match(query, app_index):
    query = query.lower()
    if query in app_index:
        return query, app_index[query]
    
    matches = difflib.get_close_matches(query, app_index.keys(), n=1, cutoff=0.6)
    if matches:
        return matches[0], app_index[matches[0]]
    
    for app_name, app_path in app_index.items():
        if query in app_name:
            return app_name, app_path
            
    return None, None

def focus_process_window(exe_name):
    exe_name = exe_name.lower()
    if not exe_name.endswith('.exe') and not exe_name.endswith('.lnk'):
        exe_name += '.exe'
    
    # If it's a shortcut (.lnk), we can't reliably guess the process name
    # We will try matching the stem as .exe
    if exe_name.endswith('.lnk'):
        exe_name = exe_name.replace('.lnk', '.exe')
        
    pids = set()
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            if proc.info['name'] and proc.info['name'].lower() == exe_name:
                pids.add(proc.info['pid'])
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    if not pids:
        return False, f"Process {exe_name} is not running."
        
    EnumWindows = ctypes.windll.user32.EnumWindows
    EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    GetWindowThreadProcessId = ctypes.windll.user32.GetWindowThreadProcessId
    IsWindowVisible = ctypes.windll.user32.IsWindowVisible
    GetWindowTextLength = ctypes.windll.user32.GetWindowTextLengthW
    GetWindowText = ctypes.windll.user32.GetWindowTextW
    SetForegroundWindow = ctypes.windll.user32.SetForegroundWindow
    ShowWindow = ctypes.windll.user32.ShowWindow
    IsIconic = ctypes.windll.user32.IsIconic
    
    SW_RESTORE = 9
    
    focused = False
    focused_title = ""
    
    def foreach_window(hwnd, lParam):
        nonlocal focused, focused_title
        if IsWindowVisible(hwnd):
            pid = wintypes.DWORD()
            GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            if pid.value in pids:
                length = GetWindowTextLength(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    GetWindowText(hwnd, buff, length + 1)
                    if IsIconic(hwnd):
                        ShowWindow(hwnd, SW_RESTORE)
                    SetForegroundWindow(hwnd)
                    focused = True
                    focused_title = buff.value
                    return False
        return True
        
    EnumWindows(EnumWindowsProc(foreach_window), 0)
    
    if focused:
        return True, f"Application is already open, focusing '{focused_title}' now."
    else:
        return False, "Process is running but no visible window found."

def launch_app(app_name_or_path):
    try:
        path_obj = Path(app_name_or_path)
        if path_obj.exists():
            # Check if it's already running and can be focused
            exe_name = path_obj.name
            focused, focus_msg = focus_process_window(exe_name)
            if focused:
                print(json.dumps({"ok": True, "message": focus_msg, "status": "focused"}))
                return
                
            os.startfile(app_name_or_path)
            print(json.dumps({"ok": True, "message": f"Launched from path: {app_name_or_path}", "status": "launched"}))
            return
        
        # Build index and try fuzzy matching
        app_index = build_app_index()
        match_name, match_path = find_best_match(app_name_or_path, app_index)
        
        if match_path:
            # Try to focus if already running
            exe_name = Path(match_path).name
            focused, focus_msg = focus_process_window(exe_name)
            if focused:
                print(json.dumps({"ok": True, "message": focus_msg, "status": "focused"}))
                return
                
            # Otherwise launch
            os.startfile(match_path)
            print(json.dumps({"ok": True, "message": f"Launched {match_name} from path: {match_path}", "status": "launched"}))
            return
            
        # Fallback to shell start if no fuzzy match is found
        subprocess.Popen(f'cmd /c start "" "{app_name_or_path}"', shell=True)
        print(json.dumps({"ok": True, "message": f"Launched command: {app_name_or_path}", "status": "launched_shell"}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        launch_app(sys.argv[1])
    else:
        print(json.dumps({"error": "Usage: app_launcher.py <app_name_or_path>"}))
