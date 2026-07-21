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
            from playwright.sync_api import sync_playwright
            import os
            
            with sync_playwright() as p:
                chrome_path = p.chromium.executable_path
                user_data = os.path.join(os.environ.get('APPDATA', ''), 'LunaAI', 'AutomationProfile')
                
                context = p.chromium.launch_persistent_context(
                    user_data_dir=user_data,
                    executable_path=chrome_path,
                    headless=False,
                    no_viewport=True,
                    args=["--window-size=800,600"]
                )
                
                page = context.pages[0] if len(context.pages) > 0 else context.new_page()
                page.goto(f"https://ig.me/m/{receiver}")
                
                # Wait for redirect and React app to load
                time.sleep(6)
                
                try:
                    if page.locator("input[name='username']").is_visible():
                        context.close()
                        return f"Error: Login required on Automation Browser to send message to {receiver}."
                    
                    page.fill("div[role='textbox']", message)
                    time.sleep(1)
                    page.keyboard.press("Enter")
                    time.sleep(2)
                    context.close()
                    return f"Message sent to Instagram user {receiver} via Playwright."
                except Exception as inner_e:
                    context.close()
                    return f"Failed to automate Instagram via Playwright: {str(inner_e)}"
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
