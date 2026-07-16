import sys
import json
import time

def perform_action(action, args):
    try:
        import pyautogui
    except ImportError:
        return {"error": "pyautogui library not installed."}
        
    pyautogui.FAILSAFE = False
    action = action.lower()

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
        return {"ok": True, "message": "Clicked mouse"}
            
    elif action == "mouse_drag":
        if len(args) < 2: return {"error": "mouse_drag requires x y"}
        x, y = int(args[0]), int(args[1])
        pyautogui.dragTo(x, y, duration=0.5, button='left')
        return {"ok": True, "message": f"Dragged mouse to {x}, {y}"}
        
    elif action == "mouse_scroll":
        if len(args) < 1: return {"error": "mouse_scroll requires amount"}
        amount = int(args[0])
        pyautogui.scroll(amount)
        return {"ok": True, "message": f"Scrolled {amount}"}
        
    elif action == "mouse_click_element":
        if len(args) < 1: return {"error": "mouse_click_element requires an element name"}
        element_name = " ".join(args)
        try:
            import uiautomation as auto
            # Set search timeout to prevent hanging indefinitely
            auto.SetGlobalSearchTimeout(3)
            
            # Find the element by Name using UIAutomation
            element = auto.Control(Name=element_name)
            
            if element.Exists(3, 1):
                rect = element.BoundingRectangle
                if rect and rect.width() > 0 and rect.height() > 0:
                    x = (rect.left + rect.right) // 2
                    y = (rect.top + rect.bottom) // 2
                    pyautogui.click(x, y)
                    return {"ok": True, "message": f"Clicked UI element '{element_name}' at {x}, {y}."}
                else:
                    return {"error": f"Element '{element_name}' found, but has an invalid bounding rectangle."}
            else:
                return {"error": f"UI Element '{element_name}' not found."}
        except ImportError:
            return {"error": "uiautomation library not installed. Please add it to requirements."}
        except Exception as e:
            return {"error": f"Error finding/clicking element: {str(e)}"}
            
    else:
        return {"error": f"Unknown action: {action}"}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: mouse_controller.py <action> [args...]\nActions: mouse_move, mouse_click, mouse_drag, mouse_scroll, mouse_click_element"
        }))
        return
        
    action = sys.argv[1]
    args = sys.argv[2:]
    
    try:
        result = perform_action(action, args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
