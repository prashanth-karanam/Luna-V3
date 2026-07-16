import sys
import json
import os
import io
import base64
from datetime import datetime

def take_screenshot(mode):
    try:
        from PIL import ImageGrab, Image
        
        desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filepath = os.path.join(desktop_path, f"Luna_Screenshot_{timestamp}.png")
        
        # Taking full screen screenshot
        img = ImageGrab.grab()
        
        # Convert to RGB in case it's RGBA
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        img.save(filepath)
        
        # Compress and encode for the AI Context
        img.thumbnail((1280, 1280)) # Downscale if larger to save tokens
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=75)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        print(json.dumps({
            "ok": True, 
            "message": f"Screenshot taken, compressed, and encoded for vision analysis. Backup saved to {filepath}",
            "path": filepath,
            "base64_image": f"data:image/jpeg;base64,{img_str}"
        }))
    except ImportError:
        print(json.dumps({"error": "Pillow is not installed. Please run: pip install Pillow"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    mode = "fullscreen"
    if len(sys.argv) > 1:
        mode = sys.argv[1]
    take_screenshot(mode)
