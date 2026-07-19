import re

with open("luna_message.py", "r", encoding="utf-8") as f:
    code = f.read()

# We'll split the file to find where _send_instagram begins
if "def _send_instagram(receiver: str, message: str) -> str:" in code:
    parts = code.split("def _send_instagram(receiver: str, message: str) -> str:")
    before_func = parts[0]
    
    # Find where the next function starts to know where _send_instagram ends
    if "def send_message" in parts[1]:
        func_parts = parts[1].split("def send_message")
        after_func = "def send_message" + func_parts[1]
    else:
        # Just in case there is no next function
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

    # Otherwise, navigate directly to the New Message modal to bypass UI notifications
    if not _open_browser_url("https://www.instagram.com/direct/new/"):
        return "Could not open Instagram new message modal in browser."
    
    time.sleep(3.5)  # Wait for modal to load and search bar to auto-focus

    # 1. Type the receiver's exact username into the auto-focused search bar
    _paste_text(receiver)
    time.sleep(2.5)  # Wait for search results
    
    # 2. Tab twice to select the top user in the list
    for _ in range(2):
        pyautogui.press("tab")
        time.sleep(0.2)
        
    # 3. Hit enter to toggle the checkbox for this user
    pyautogui.press("enter")
    time.sleep(0.5)

    # 4. Tab once to focus the 'Chat' button at the bottom of the modal, and hit enter
    pyautogui.press("tab")
    time.sleep(0.2)
    pyautogui.press("enter")
    
    time.sleep(2.5)  # Wait for chat window to initialize
    
    # 5. Type message and hit enter
    _paste_text(message)
    time.sleep(0.2)
    pyautogui.press("enter")
    
    return f"Message sent to {receiver} via direct modal automation."

"""
    
    new_code = before_func + "def _send_instagram(receiver: str, message: str) -> str:" + new_func_body + after_func
    
    with open("luna_message.py", "w", encoding="utf-8") as f:
        f.write(new_code)
        
    print("Successfully replaced _send_instagram!")
else:
    print("Could not find function signature.")
