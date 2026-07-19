import re

with open("luna_message.py", "r", encoding="utf-8") as f:
    code = f.read()

parts = code.split("def _send_instagram(receiver: str, message: str) -> str:")
before_func = parts[0]
if "def send_message" in parts[1]:
    func_parts = parts[1].split("def send_message")
    after_func = "def send_message" + func_parts[1]
else:
    func_parts = [parts[1]]
    after_func = ""
    
new_func_body = """
    _require_pyautogui()

    # If the receiver was resolved to a direct Instagram URL from contacts.json
    if receiver.startswith("http"):
        if not _open_browser_url(receiver):
            return "Could not open Instagram in browser."
        time.sleep(2.5)  # wait for chat to load
        _paste_text(message)
        time.sleep(0.2)
        pyautogui.press("enter")
        time.sleep(0.3)
        return f"Message sent via direct URL to {receiver}."

    # Instagram's "New Message" modal search is bugged for anonymous users.
    # So we bypass the inbox entirely, go straight to their profile, and use JS injection to click the "Message" button!
    profile_url = f"https://www.instagram.com/{receiver}/"
    if not _open_browser_url(profile_url):
        return "Could not open Instagram profile in browser."
    
    time.sleep(4.5)  # Wait for profile page to fully load

    # INJECTION: Click the "Message" button on their profile page
    pyautogui.hotkey('ctrl', 'l')  # Focus URL bar
    time.sleep(0.2)
    pyautogui.typewrite("javascript:")
    _paste_text("(function(){ let b = Array.from(document.querySelectorAll('div[role=\"button\"], button, a')).find(e => e.textContent === 'Message'); if(b) b.click(); })();")
    time.sleep(0.2)
    pyautogui.press("enter")
    
    time.sleep(3.5)  # Wait for the chat window to open and initialize
    
    # Type message and hit enter
    _paste_text(message)
    time.sleep(0.2)
    pyautogui.press("enter")
    
    return f"Message sent to {receiver} via Profile JS Injection automation."

"""

new_code = before_func + "def _send_instagram(receiver: str, message: str) -> str:" + new_func_body + after_func

with open("luna_message.py", "w", encoding="utf-8") as f:
    f.write(new_code)
    
print("Successfully replaced _send_instagram with Profile Route JS injection method!")
