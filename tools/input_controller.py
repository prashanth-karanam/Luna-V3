import sys
import json
import time
from pathlib import Path

def take_screenshot():
    try:
        from PIL import ImageGrab
        return ImageGrab.grab()
    except Exception:
        return None

def check_visual_change(img_before, img_after):
    if not img_before or not img_after:
        return None
    try:
        from PIL import ImageChops
        diff = ImageChops.difference(img_before, img_after)
        return diff.getbbox() is not None
    except Exception:
        return None

def perform_mouse_action(action, args):
    import pyautogui
    pyautogui.FAILSAFE = False
    
    action = action.lower()
    
    img_before = None
    if action in ['mouse_click', 'mouse_drag', 'mouse_scroll', 'mouse_click_element']:
        img_before = take_screenshot()

    x, y = None, None
    if action == "mouse_move":
        if len(args) < 2: return {"error": "mouse_move requires x y"}
        x, y = int(args[0]), int(args[1])
        pyautogui.moveTo(x, y, duration=0.25)
        return {"ok": True, "message": f"Moved mouse to {x}, {y}"}
        
    elif action == "mouse_click":
        if len(args) >= 2:
            x, y = int(args[0]), int(args[1])
            pyautogui.click(x, y)
        else:
            pyautogui.click()
            
    elif action == "mouse_drag":
        if len(args) < 2: return {"error": "mouse_drag requires x y"}
        x, y = int(args[0]), int(args[1])
        pyautogui.dragTo(x, y, duration=0.5, button='left')
        
    elif action == "mouse_scroll":
        if len(args) < 1: return {"error": "mouse_scroll requires y (amount)"}
        y = int(args[0])
        pyautogui.scroll(y)
        
    elif action == "mouse_click_element":
        if len(args) < 1: return {"error": "mouse_click_element requires an element name"}
        element_name = " ".join(args)
        try:
            import uiautomation as auto
            auto.SetGlobalSearchTimeout(3)
            element = auto.Control(Name=element_name)
            if element.Exists(3, 1):
                rect = element.BoundingRectangle
                if rect and rect.width() > 0 and rect.height() > 0:
                    x = (rect.left + rect.right) // 2
                    y = (rect.top + rect.bottom) // 2
                    pyautogui.click(x, y)
                else:
                    return {"error": f"Element '{element_name}' has an invalid bounding rectangle."}
            else:
                return {"error": f"UI Element '{element_name}' not found."}
        except ImportError:
            return {"error": "uiautomation library not installed."}
        except Exception as e:
            return {"error": f"Error finding/clicking element: {str(e)}"}
            
    else:
        return {"error": f"Unknown mouse action: {action}"}
        
    # Verification
    time.sleep(0.5)
    img_after = take_screenshot()
    changed = check_visual_change(img_before, img_after)
    
    msg = f"Action {action} executed."
    if changed is False:
        msg += " WARNING: No visual UI change detected. The action may have had no effect."
    elif changed is True:
        msg += " Visual change confirmed."
        
    return {"ok": True, "message": msg, "visual_change": changed}

def perform_keyboard_action(action, args):
    import pyautogui
    pyautogui.FAILSAFE = False
    
    action = action.lower()
    
    delay = 0.0
    if "--delay" in args:
        idx = args.index("--delay")
        if idx + 1 < len(args):
            try:
                delay = float(args[idx+1])
            except ValueError:
                pass
            args.pop(idx+1)
            args.pop(idx)
            
    wait_for_window = None
    if "--wait_for_window" in args:
        idx = args.index("--wait_for_window")
        if idx + 1 < len(args):
            wait_for_window = args[idx+1]
            args.pop(idx+1)
            args.pop(idx)

    if delay > 0:
        time.sleep(delay)
        
    if wait_for_window:
        for _ in range(50):
            try:
                title = pyautogui.getActiveWindowTitle()
                if title and wait_for_window.lower() in title.lower():
                    break
            except Exception:
                pass
            time.sleep(0.1)
            
    if action == "keyboard_type":
        if len(args) < 1: return {"error": "keyboard_type requires text"}
        text = " ".join(args)
        
        img_before = take_screenshot()
        pyautogui.write(text, interval=0.01)
        time.sleep(0.5)
        img_after = take_screenshot()
        changed = check_visual_change(img_before, img_after)
        
        msg = f"Typed text."
        if changed is False:
            msg += " WARNING: No visual UI change detected. You might not be focused on a text field."
        elif changed is True:
            msg += " Visual change confirmed."
            
        return {"ok": True, "message": msg, "visual_change": changed}
        
    elif action == "keyboard_hotkey":
        if len(args) < 1: return {"error": "keyboard_hotkey requires keys (e.g. ctrl+c)"}
        keys = args[0].split('+')
        
        # Clipboard handling
        clipboard_check = False
        import pyperclip
        clipboard_before = None
        if "c" in keys or "x" in keys:
            if "ctrl" in keys or "command" in keys:
                clipboard_check = True
                try:
                    clipboard_before = pyperclip.paste()
                except Exception:
                    pass
                    
        img_before = take_screenshot() if not clipboard_check else None
        
        pyautogui.hotkey(*keys)
        time.sleep(0.5)
        
        if clipboard_check:
            clipboard_after = ""
            try:
                clipboard_after = pyperclip.paste()
            except Exception:
                pass
            
            if clipboard_before != clipboard_after:
                return {"ok": True, "message": f"Hotkey {args[0]} executed. Clipboard updated.", "clipboard": clipboard_after}
            else:
                return {"ok": True, "message": f"Hotkey {args[0]} executed. WARNING: Clipboard did not change. It might be the same content, or the copy failed.", "clipboard": clipboard_after}
        else:
            img_after = take_screenshot()
            changed = check_visual_change(img_before, img_after)
            
            msg = f"Hotkey {args[0]} executed."
            if changed is False:
                msg += " WARNING: No visual UI change detected."
            elif changed is True:
                msg += " Visual change confirmed."
                
            return {"ok": True, "message": msg, "visual_change": changed}
    else:
        return {"error": f"Unknown keyboard action: {action}"}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: input_controller.py <action> [args...]\nActions: mouse_move, mouse_click, mouse_drag, mouse_scroll, mouse_click_element, keyboard_type, keyboard_hotkey"}))
        return
        
    action = sys.argv[1]
    args = sys.argv[2:]
    
    try:
        if action.startswith("mouse_"):
            result = perform_mouse_action(action, args)
        elif action.startswith("keyboard_"):
            result = perform_keyboard_action(action, args)
        else:
            result = {"error": f"Unknown action: {action}"}
            
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
