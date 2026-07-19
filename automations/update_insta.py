import re

with open("luna_message.py", "r", encoding="utf-8") as f:
    code = f.read()

new_instagram_func = """def _send_instagram(receiver: str, message: str) -> str:
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

    # Otherwise, fallback to the 4-tab search method
    if not _open_browser_url("https://www.instagram.com/direct/inbox/"):
        return "Could not open Instagram inbox in browser."
    
    time.sleep(3.0)  # Wait for inbox to load

    # 1. Click tab 4 times
    for _ in range(4):
        pyautogui.press("tab")
        time.sleep(0.2)
    
    # 2. Click enter (Opens New Message modal)
    pyautogui.press("enter")
    time.sleep(1.5)
    
    # 3. Click tab 2 times
    for _ in range(2):
        pyautogui.press("tab")
        time.sleep(0.2)
        
    # 4. Search user ID
    _paste_text(receiver)
    time.sleep(2.0)  # Wait for search results to populate
    
    # 5. Click tab 2 times
    for _ in range(2):
        pyautogui.press("tab")
        time.sleep(0.2)
        
    # 6. Click enter (Selects user)
    pyautogui.press("enter")
    time.sleep(1.0)
    
    # Press tab to go to "Chat" button and enter (Insta UI requires clicking Next sometimes, but let's assume they just need to hit enter on Chat, or Tab 1-2 times to Next)
    # Actually, after selecting the user, the 'Chat' / 'Next' button needs to be pressed. 
    # Usually it's Tab -> Enter. We will add a generalized Tab -> Enter just in case, or just assume the UI auto-focuses.
    # The user's exact instruction: "click tab again 2 times and click enter, and type message and enter"
    # Wait, the user already included the 2 tabs above: "click tab again 2 times and click enter".
    # Oh wait, let's re-read user prompt: 
    # "click tab 4 times, and click enter and click tab 2 times and search user ID ... and click tab again 2 times and click enter, and type message and enter"
    # Yes, exactly what we mapped!
    
    # Next step: Type message and enter
    time.sleep(1.5) # Wait for chat window to open after clicking Next/Chat
    _paste_text(message)
    time.sleep(0.2)
    pyautogui.press("enter")
    time.sleep(0.3)

    return f"Message sent to {receiver} via Instagram web."
"""

# Replace the old _send_instagram function
code = re.sub(r'def _send_instagram\(receiver: str, message: str\) -> str:.*?return f"Message sent to \{receiver\} via Instagram\."', new_instagram_func, code, flags=re.DOTALL)

with open("luna_message.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated _send_instagram!")
