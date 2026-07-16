import pyautogui
import time
import sys
import os
import subprocess
import uiautomation as auto
from rapidfuzz import process, utils

# -----------------
# APP CACHE INDEXER
# -----------------
APP_CACHE = {}

def build_app_cache():
    global APP_CACHE
    APP_CACHE = {}
    print("Building App Cache...")
    
    # 1. Start Menu & Desktop .lnk files
    import glob
    paths = [os.environ.get('ProgramData', ''), os.environ.get('APPDATA', ''), os.environ.get('PUBLIC', '')]
    paths = [os.path.join(p, 'Microsoft', 'Windows', 'Start Menu', 'Programs') for p in paths if p]
    paths.append(os.path.join(os.path.expanduser('~'), 'Desktop'))
    paths.append('C:\\Users\\Public\\Desktop')
    
    for path in paths:
        if os.path.exists(path):
            for root, dirs, files in os.walk(path):
                for file in files:
                    if file.lower().endswith('.lnk'):
                        name = file[:-4].lower()
                        APP_CACHE[name] = os.path.join(root, file)
                        
    # 2. Registry App Paths
    import winreg
    for hive in [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]:
        try:
            key = winreg.OpenKey(hive, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths")
            for i in range(winreg.QueryInfoKey(key)[0]):
                try:
                    app_key = winreg.EnumKey(key, i)
                    subkey = winreg.OpenKey(key, app_key)
                    path, _ = winreg.QueryValueEx(subkey, "")
                    app_name = app_key.lower().replace('.exe', '')
                    if app_name not in APP_CACHE:
                        APP_CACHE[app_name] = path
                except WindowsError:
                    continue
        except WindowsError:
            continue
            
    print(f"App Cache built. Indexed {len(APP_CACHE)} items.")

build_app_cache()

# -----------------
# VISION & CLICKING
# -----------------

def click_text(text, clicks=1, button='left'):
    print(f"Searching for text: '{text}'...")
    
    center_x, center_y = None, None
    found_method = None
    
    # 1. Try uiautomation first (fast and doesn't require Tesseract)
    try:
        import uiautomation as auto
        auto.SetGlobalSearchTimeout(0.5)
        control = None
        
        # Try active window first
        active_win = auto.GetForegroundControl()
        if active_win:
            ctrl = active_win.Control(Name=text)
            if ctrl.Exists(0, 0): 
                control = ctrl
            else:
                ctrl = active_win.Control(searchDepth=5, RegexName=f".*{text}.*")
                if ctrl.Exists(0, 0): 
                    control = ctrl
                
        # Try globally if not found in active window
        if not control:
            ctrl = auto.Control(Name=text)
            if ctrl.Exists(0, 0): 
                control = ctrl
            
        if control:
            rect = control.BoundingRectangle
            if rect.width() > 0 and rect.height() > 0:
                center_x = rect.left + (rect.width() // 2)
                center_y = rect.top + (rect.height() // 2)
                found_method = "UIAutomation"
    except Exception as e:
        print(f"UIAutomation fallback: {e}")

    # 2. Fallback to Tesseract OCR if UIAutomation didn't find it
    if not found_method:
        match = find_text_on_screen(text)
        if match:
            x, y, w, h = match
            center_x = x + (w // 2)
            center_y = y + (h // 2)
            found_method = "OCR"

    if found_method and center_x is not None and center_y is not None:
        pyautogui.moveTo(center_x, center_y, duration=0.2)
        pyautogui.click(clicks=clicks, button=button)
        print(f"Successfully clicked '{text}' at ({center_x}, {center_y}) via {found_method}")
        return True
    else:
        print(f"Failed to find text: '{text}' on screen.")
        return False

def type_text(text, press_enter=False):
    print(f"Typing: '{text}'...")
    pyautogui.write(text, interval=0.01)
    if press_enter:
        pyautogui.press('enter')
    print("Done typing.")
    return True
    
def press(key):
    print(f"Pressing key: '{key}'...")
    pyautogui.press(key)
    return True

def hotkey(*keys):
    print(f"Pressing hotkey: {' + '.join(keys)}...")
    pyautogui.hotkey(*keys)
    return True
    
def scroll(amount):
    print(f"Scrolling {amount}...")
    pyautogui.scroll(amount)
    return True

def mouse_click(x, y, button='left'):
    print(f"Clicking at ({x}, {y})...")
    pyautogui.click(x=x, y=y, button=button)
    return True

def open_app(app_name):
    print(f"Opening app: {app_name}")
    
    # 0. Check common aliases for instant launch
    app_aliases = {
        "filemanager": "explorer",
        "file manager": "explorer",
        "files": "explorer",
        "explorer": "explorer",
        "cmd": "cmd",
        "command prompt": "cmd",
        "terminal": "cmd",
        "powershell": "powershell",
        "browser": "msedge",
        "edge": "msedge",
        "microsoft edge": "msedge",
        "notepad": "notepad",
        "calculator": "calc",
        "calc": "calc",
        "paint": "mspaint",
        "settings": "ms-settings:",
        "task manager": "taskmgr",
        "control panel": "control",
        "snipping tool": "snippingtool",
        "wordpad": "wordpad",
    }
    app_name_lower = app_name.lower()
    
    import time
    if app_name_lower in app_aliases:
        os.system(f"start {app_aliases[app_name_lower]}")
        print(f"Successfully launched {app_name} (Alias).")
        time.sleep(1.5)
        return True
        
    # 1. Fuzzy match using APP_CACHE
    if not APP_CACHE:
        build_app_cache()
        
    match = process.extractOne(app_name_lower, APP_CACHE.keys(), processor=utils.default_process)
    if match and match[1] > 70:  # 70% confidence
        matched_name = match[0]
        app_path = APP_CACHE[matched_name]
        try:
            os.startfile(app_path)
            print(f"Successfully launched {app_name} via {matched_name}.")
            time.sleep(1.5)
            return True
        except Exception as e:
            print(f"Failed to launch via shortcut: {e}")
            
    # 2. UWP App handling
    ps_uwp = f"$appItem = (New-Object -ComObject Shell.Application).NameSpace('shell:::{{4234d49b-0245-4df3-b780-3893943456e1}}').Items() | Where-Object Name -match '{app_name}' | Select-Object -First 1; if ($appItem) {{ $appItem.InvokeVerb('open'); 'Success' }} else {{ 'Not found' }}"
    res_uwp = subprocess.run(["powershell", "-Command", ps_uwp], capture_output=True, text=True)
    if "Success" in res_uwp.stdout:
        print(f"Successfully launched {app_name} (UWP/Shell).")
        time.sleep(1.5)
        return True
        
    # 3. PATH execution
    try:
        where_res = subprocess.run(["where", app_name], capture_output=True, text=True)
        if where_res.returncode == 0:
            os.system(f"start {app_name}")
            print(f"Successfully launched {app_name} (PATH).")
            time.sleep(1.5)
            return True
    except: pass
        
    print(f"Failed to find installed desktop app '{app_name}'.")
    return False

def open_path(path):
    if path.startswith('~'): path = os.path.expanduser(path)
    elif 'YourUsername' in path:
        try: path = path.replace('YourUsername', os.getlogin())
        except: path = path.replace('YourUsername', 'PRASANTH')
    print(f"Opening path: {path}")
    try:
        os.startfile(path)
        print("Successfully opened path.")
        return True
    except Exception as e:
        print(f"Failed to open path: {e}")
        return False

def silent_search(query, api_key=None):
    try:
        if api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=f"Search for and answer accurately: {query}",
                    config={"tools": [{"google_search": {}}]},
                )
                text = ""
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "text") and part.text:
                        text += part.text
                text = text.strip()
                if text:
                    return text
            except Exception as e:
                print(f"[SILENT_SEARCH] Gemini search failed ({e}), falling back to DDG...")

        from ddgs import DDGS
        print(f"Silently searching web via DDG for: {query}")
        results = DDGS().text(query, max_results=5)
        
        if not results:
            return "No results found."
            
        formatted = []
        for r in results:
            title = r.get('title', '')
            body = r.get('body', '')
            href = r.get('href', '')
            formatted.append(f"[{title}]({href})\n{body}")
            
        return "\n\n---\n\n".join(formatted)
    except Exception as e:
        return f"Failed to search web silently: {e}"

def tab_and_check_until(target_text, max_tabs=20):
    import pyautogui, time, pyperclip
    for i in range(max_tabs):
        pyautogui.press('tab')
        time.sleep(0.1)
        pyperclip.copy('')
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(0.1)
        clip = pyperclip.paste()
        if clip and isinstance(clip, str) and target_text.lower() in clip.lower():
            return f"Found '{target_text}' in clipboard after {i+1} tabs. Current clipboard: {clip}"
    return f"Did not find '{target_text}' after {max_tabs} tabs."

def open_url(url, browser=None):
    import os, time
    print(f"Opening URL: {url} in {browser if browser else 'default browser'}...")
    if not url.startswith('http'): url = 'https://' + url
    if browser:
        os.system(f"start {browser} \"{url}\"")
    else:
        os.system(f"start \"\" \"{url}\"")
    time.sleep(2.5) # Wait for browser to launch and page to load
    return True
