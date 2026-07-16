import sys
import json
import difflib

def manage_window(action, title=""):
    try:
        import pygetwindow as gw
        action = action.lower()
        
        all_windows = [w for w in gw.getAllWindows() if w.title.strip()]
        
        if action == "list":
            titles = [w.title for w in all_windows]
            print(json.dumps({"ok": True, "windows": titles}))
            return

        if not title:
            print(json.dumps({"error": "A title is required for this action."}))
            return
            
        win = None
        # 1. Substring match (case-insensitive)
        for w in all_windows:
            if title.lower() in w.title.lower():
                win = w
                break
                
        # 2. Fuzzy match
        if not win:
            titles = [w.title for w in all_windows]
            matches = difflib.get_close_matches(title, titles, n=1, cutoff=0.3)
            if matches:
                best_match = matches[0]
                for w in all_windows:
                    if w.title == best_match:
                        win = w
                        break
        
        if not win:
            print(json.dumps({"error": f"No window found matching title: {title}"}))
            return
        
        if action == "minimize":
            win.minimize()
        elif action == "maximize":
            win.maximize()
        elif action == "close":
            win.close()
        elif action == "focus":
            win.activate()
        else:
            print(json.dumps({"error": f"Unknown action: {action}"}))
            return
            
        print(json.dumps({"ok": True, "message": f"Successfully performed {action} on window '{win.title}'"}))
    except ImportError:
        print(json.dumps({"error": "pygetwindow is not installed. Please run: pip install pygetwindow"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        title = sys.argv[2] if len(sys.argv) > 2 else ""
        manage_window(action, title)
    else:
        print(json.dumps({"error": "Usage: window_manager.py <action> [title]"}))
