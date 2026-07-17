import json
import subprocess
import sys
import time
from pathlib import Path

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE    = 0.06
    _PYAUTOGUI = True
except ImportError:
    _PYAUTOGUI = False

try:
    import pyperclip
    _PYPERCLIP = True
except ImportError:
    _PYPERCLIP = False

def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent

def _get_os() -> str:
    try:
        cfg = json.loads(
            (_base_dir() / "config" / "api_keys.json").read_text(encoding="utf-8")
        )
        return cfg.get("os_system", "windows").lower()
    except Exception:
        return "windows"


def _require_pyautogui():
    if not _PYAUTOGUI:
        raise RuntimeError("PyAutoGUI not installed. Run: pip install pyautogui")


def _paste_text(text: str) -> None:
    _require_pyautogui()

    os_name = _get_os()
    paste_hotkey = ("command", "v") if os_name == "mac" else ("ctrl", "v")

    if _PYPERCLIP:
        pyperclip.copy(text)
        time.sleep(0.15)
        pyautogui.hotkey(*paste_hotkey)
        time.sleep(0.1)
    else:
        pyautogui.write(text, interval=0.03)


def _clear_and_paste(text: str) -> None:
    _require_pyautogui()
    os_name = _get_os()
    select_all = ("command", "a") if os_name == "mac" else ("ctrl", "a")
    pyautogui.hotkey(*select_all)
    time.sleep(0.1)
    pyautogui.press("delete")
    time.sleep(0.1)
    _paste_text(text)

def _open_app(app_name: str) -> bool:
    _require_pyautogui()
    os_name = _get_os()

    try:
        if os_name == "windows":
            pyautogui.press("win")
            time.sleep(0.5)
            _paste_text(app_name)
            time.sleep(0.6)
            pyautogui.press("enter")
            time.sleep(2.5)
            return True

        elif os_name == "mac":
            result = subprocess.run(
                ["open", "-a", app_name],
                capture_output=True, text=True, timeout=10,
            )
            if result.returncode != 0:
                result = subprocess.run(
                    ["open", "-a", f"{app_name}.app"],
                    capture_output=True, text=True, timeout=10,
                )
            time.sleep(2.5)
            return result.returncode == 0

        else: 
            launched = False
            for launcher in [
                ["gtk-launch", app_name.lower()],
                [app_name.lower()],
            ]:
                try:
                    subprocess.Popen(
                        launcher,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    launched = True
                    break
                except FileNotFoundError:
                    continue
            time.sleep(2.5)
            return launched

    except Exception as e:
        print(f"[SendMessage] ⚠️ Could not open {app_name}: {e}")
        return False


def _open_browser_url(url: str) -> bool:
    import webbrowser
    try:
        webbrowser.open(url)
        time.sleep(4.0) 
        return True
    except Exception as e:
        print(f"[SendMessage] ⚠️ Could not open browser: {e}")
        return False

def _search_in_app(query: str) -> None:
    _require_pyautogui()
    os_name = _get_os()
    search_hotkey = ("command", "f") if os_name == "mac" else ("ctrl", "f")

    pyautogui.hotkey(*search_hotkey)
    time.sleep(0.5)
    _clear_and_paste(query)
    time.sleep(1.0)

def _desktop_send(app_name: str, receiver: str, message: str) -> str:
    if not _open_app(app_name):
        return f"Could not open {app_name}."

    time.sleep(1.0)
    _search_in_app(receiver)
    pyautogui.press("enter")
    time.sleep(0.8)

    _paste_text(message)
    time.sleep(0.2)
    pyautogui.press("enter")
    time.sleep(0.3)
    return f"Message sent to {receiver} via {app_name}."

def _send_whatsapp(receiver: str, message: str) -> str:
    return _desktop_send("WhatsApp", receiver, message)

def _send_telegram(receiver: str, message: str) -> str:
    return _desktop_send("Telegram", receiver, message)

def _send_signal(receiver: str, message: str) -> str:
    return _desktop_send("Signal", receiver, message)


def _send_discord(receiver: str, message: str) -> str:
    return _desktop_send("Discord", receiver, message)


def _send_instagram(receiver: str, message: str) -> str:
    # GHOST BROWSER ARCHITECTURE (Playwright)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return "Playwright not installed. Run: pip install playwright"
        
    user_data_dir = _base_dir() / "config" / "ghost_profile"
    
    # If the receiver was resolved to a direct Instagram URL from contacts.json
    if receiver.startswith("http"):
        target_url = receiver
    else:
        target_url = f"https://www.instagram.com/{receiver}/"
        
    try:
        with sync_playwright() as p:
            # Launch invisible browser
            browser = p.chromium.launch_persistent_context(
                user_data_dir=str(user_data_dir),
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            page = browser.new_page()
            
            try:
                page.goto(target_url, timeout=20000)
                
                # Check for login wall
                if page.locator("input[name='username']").count() > 0 or page.locator("button:has-text('Log in')").count() > 0:
                    return "Not logged into Instagram. Run `python luna_message.py login` in your terminal to authenticate."
                
                # If we went to a profile, click the Message button
                if not receiver.startswith("http"):
                    msg_btn = page.locator("div[role='button']:has-text('Message'), button:has-text('Message'), a:has-text('Message')").first
                    msg_btn.wait_for(state="visible", timeout=10000)
                    msg_btn.click()
                
                # Wait for chat box
                chat_box = page.locator("div[contenteditable='true']").first
                chat_box.wait_for(state="visible", timeout=15000)
                
                # Send message
                chat_box.fill(message)
                page.keyboard.press("Enter")
                
                time.sleep(1.0) # Ensure it fires before closing
                return f"Message sent to {receiver} via silent Ghost Browser."
                
            except Exception as e:
                return f"Ghost Browser navigation failed: {str(e)}"
            finally:
                browser.close()
    except Exception as e:
        return f"Playwright failed: {str(e)}"
def send_message(
    parameters: dict,
    response=None,
    player=None,
    session_memory=None,
) -> str:
    params       = parameters or {}
    receiver     = params.get("receiver", "").strip()
    message_text = params.get("message_text", "").strip()
    platform     = params.get("platform", "whatsapp").strip()
    
    # Resolve aliases like 'shashi' -> 'shashank_vr_18'
    receiver = _resolve_contact(receiver)

    if not receiver:
        return "Please specify a recipient."
    if not message_text:
        return "Please specify the message content."
    if not _PYAUTOGUI:
        return "PyAutoGUI is not installed — cannot control the desktop."

    preview = message_text[:50] + ("…" if len(message_text) > 50 else "")
    print(f"[SendMessage] 📨 {platform} → {receiver}: {preview}")
    if player:
        player.write_log(f"[msg] {platform} → {receiver}")

    try:
        handler = _resolve_platform(platform)
        result  = handler(receiver, message_text)
    except Exception as e:
        result = f"Could not send message: {e}"

    print(f"[SendMessage] {'✅' if 'sent' in result.lower() else '❌'} {result}")
    if player:
        player.write_log(f"[msg] {result}")

    return result

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "login":
        print("Launching Ghost Browser in headed mode for Instagram login...")
        try:
            from playwright.sync_api import sync_playwright
            user_data_dir = _base_dir() / "config" / "ghost_profile"
            with sync_playwright() as p:
                browser = p.chromium.launch_persistent_context(
                    user_data_dir=str(user_data_dir),
                    headless=False,
                    args=["--disable-blink-features=AutomationControlled"]
                )
                page = browser.new_page()
                page.goto("https://www.instagram.com/")
                print("Please log into Instagram in the browser window.")
                print("Close the browser window when you are done to save your session.")
                try:
                    page.wait_for_event("close", timeout=0)
                except Exception:
                    pass
                print("Session saved. You can now use Luna to send messages silently!")
        except ImportError:
            print("Playwright not installed. Run: pip install playwright")
