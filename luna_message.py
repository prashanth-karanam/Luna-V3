import json
import subprocess
import sys
import time
import os
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
    return Path(__file__).resolve().parent

def _get_os() -> str:
    try:
        cfg = json.loads(
            (_base_dir() / "config" / "api_keys.json").read_text(encoding="utf-8")
        )
        return cfg.get("os_system", "windows").lower()
    except Exception:
        return "windows"

# ─── Contact / Alias Resolution ─────────────────────────────

def _load_contacts() -> dict:
    """Load contacts.json from project root."""
    try:
        contacts_file = _base_dir() / "contacts.json"
        if contacts_file.exists():
            return json.loads(contacts_file.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[SendMessage] Could not load contacts: {e}")
    return {}

def _resolve_contact(receiver: str) -> str:
    """Check if receiver is an alias in contacts.json; return the resolved value."""
    contacts = _load_contacts()
    lower = receiver.lower().strip()
    for name, target in contacts.items():
        if name.lower().strip() == lower:
            print(f"[SendMessage] Resolved alias '{receiver}' -> '{target}'")
            return target
    return receiver

def _resolve_platform(platform: str):
    """Return the handler function for the given platform."""
    handlers = {
        "whatsapp":  _send_whatsapp,
        "instagram": _send_instagram,
        "telegram":  _send_telegram,
        "discord":   _send_discord,
        "signal":    _send_signal,
    }
    p = platform.lower().strip()
    if p in handlers:
        return handlers[p]
    # Fuzzy match
    for key in handlers:
        if key.startswith(p) or p.startswith(key):
            return handlers[key]
    raise ValueError(f"Unknown platform: {platform}")

# ─── Helpers ─────────────────────────────────────────────────

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

# ─── Desktop-based senders (WhatsApp, Telegram, etc.) ────────

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
            for launcher in [["gtk-launch", app_name.lower()], [app_name.lower()]]:
                try:
                    subprocess.Popen(launcher, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    time.sleep(2.5)
                    return True
                except FileNotFoundError:
                    continue
            return False
    except Exception as e:
        print(f"[SendMessage] Could not open {app_name}: {e}")
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

# ─── Instagram: Selenium-based (no vision, no token waste) ───

def _get_selenium_driver():
    """Get a visible Selenium Chrome driver with Instagram cookies."""
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service as ChromeService
    from webdriver_manager.chrome import ChromeDriverManager

    # Use a persistent profile so Instagram stays logged in
    profile_dir = str(_base_dir() / "config" / "selenium_profile")
    os.makedirs(profile_dir, exist_ok=True)

    options = webdriver.ChromeOptions()
    options.add_argument(f"--user-data-dir={profile_dir}")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    # NOT headless — user needs to see the browser for login/verification
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    driver = webdriver.Chrome(
        service=ChromeService(ChromeDriverManager().install()),
        options=options
    )
    driver.set_page_load_timeout(20)
    return driver

def _send_instagram(receiver: str, message: str) -> str:
    """Send Instagram DM using Selenium — direct browser control, no vision."""
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.keys import Keys

    driver = None
    try:
        driver = _get_selenium_driver()

        # CASE 1: Receiver is a direct DM link (alias resolved)
        if receiver.startswith("http"):
            print(f"[SendMessage] Opening direct DM link: {receiver}")
            driver.get(receiver)
            time.sleep(4)

            # Find the message input box and type
            try:
                # Instagram DM input — try the contenteditable div first
                msg_box = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 
                        "div[role='textbox'][contenteditable='true'], "
                        "textarea[placeholder*='Message'], "
                        "input[placeholder*='Message']"
                    ))
                )
                msg_box.click()
                time.sleep(0.3)
                msg_box.send_keys(message)
                time.sleep(0.3)
                msg_box.send_keys(Keys.RETURN)
                time.sleep(1)
                return f"Message sent via direct DM link."
            except Exception as e:
                return f"Could not find message box on DM page: {e}"

        # CASE 2: Receiver is a username (no alias / not in contacts)
        else:
            profile_url = f"https://www.instagram.com/{receiver}/"
            print(f"[SendMessage] Opening profile: {profile_url}")
            driver.get(profile_url)
            time.sleep(3)

            # Click the "Message" button on the profile page
            try:
                msg_btn = WebDriverWait(driver, 8).until(
                    EC.element_to_be_clickable((By.XPATH,
                        "//div[text()='Message'] | //button[contains(text(),'Message')]"
                    ))
                )
                msg_btn.click()
                time.sleep(3)
            except Exception as e:
                return f"Could not find 'Message' button on {receiver}'s profile: {e}"

            # Type in the DM box
            try:
                msg_box = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR,
                        "div[role='textbox'][contenteditable='true'], "
                        "textarea[placeholder*='Message'], "
                        "input[placeholder*='Message']"
                    ))
                )
                msg_box.click()
                time.sleep(0.3)
                msg_box.send_keys(message)
                time.sleep(0.3)
                msg_box.send_keys(Keys.RETURN)
                time.sleep(1)
                return f"Message sent to {receiver} via Instagram."
            except Exception as e:
                return f"Could not type message in DM box: {e}"

    except Exception as e:
        return f"Instagram messaging failed: {e}"
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass

# ─── Main entry point ────────────────────────────────────────

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

    # Resolve aliases (e.g. 'shashi' -> DM link)
    receiver = _resolve_contact(receiver)

    if not receiver or receiver.lower() in ("none", "null", "?"):
        return "Please specify a recipient."
    if not message_text or message_text.lower() in ("none", "null", "?"):
        return "Please specify the message content."

    preview = message_text[:50] + ("…" if len(message_text) > 50 else "")
    print(f"[SendMessage] {platform} -> {receiver}: {preview}")

    try:
        handler = _resolve_platform(platform)
        result  = handler(receiver, message_text)
    except Exception as e:
        result = f"Could not send message: {e}"

    print(f"[SendMessage] {'OK' if 'sent' in result.lower() else 'FAIL'} {result}")
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "login":
        print("Launching Selenium browser for Instagram login...")
        driver = _get_selenium_driver()
        driver.get("https://www.instagram.com/")
        print("Please log into Instagram in the browser window.")
        print("Press Enter in this terminal when done...")
        input()
        driver.quit()
        print("Session saved to config/selenium_profile/. You can now send messages!")
