import sys
import time
import subprocess
import urllib.parse
import os

def send_message(data):
    try:
        import pyautogui
    except ImportError:
        return "Error: pyautogui module not installed. Please pip install pyautogui."

    platform = data.get('platform', '').lower()
    receiver = data.get('receiver', '')
    message = data.get('message_text', '')
    
    try:
        if platform in ['whatsapp', 'wa']:
            url = f"whatsapp://send?text={urllib.parse.quote(message)}"
            os.system(f'start "" "{url}"')
            time.sleep(3)
            pyautogui.press('enter')
            return "Message queued to WhatsApp."
            
        elif platform in ['instagram', 'insta', 'ig']:
            # Use IG.ME links to open direct message directly!
            url = f"https://ig.me/m/{receiver}"
            os.system(f'start "" "{url}"')
            time.sleep(9) # Wait longer for IG.ME redirect and React SPA to fully mount
            pyautogui.write(message, interval=0.01)
            time.sleep(0.5)
            pyautogui.press('enter')
            return f"Message typed into Instagram for {receiver}."
            
        elif platform in ['discord']:
            os.system(f'start discord://')
            time.sleep(4)
            pyautogui.hotkey('ctrl', 'k')
            time.sleep(1)
            pyautogui.write(receiver, interval=0.05)
            time.sleep(1)
            pyautogui.press('enter')
            time.sleep(1)
            pyautogui.write(message, interval=0.01)
            pyautogui.press('enter')
            return "Message sent in Discord."
            
        elif platform in ['telegram', 'tg']:
            url = f"tg://msg?text={urllib.parse.quote(message)}&to={receiver}"
            os.system(f'start "" "{url}"')
            time.sleep(3)
            pyautogui.press('enter')
            return "Message typed into Telegram."
            
        else:
            return f"Unsupported platform: {platform}"
    except Exception as e:
        return f"Error sending message: {str(e)}"
