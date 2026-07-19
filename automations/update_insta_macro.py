import re

with open("luna_message.py", "r", encoding="utf-8") as f:
    code = f.read()

old_block = """    # Otherwise, fallback to the 4-tab search method
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
        
    # 6. Click enter to select user
    pyautogui.press("enter")
    time.sleep(1.5)
    
    # 7. Type message and hit enter
    _paste_text(message)
    time.sleep(0.2)
    pyautogui.press("enter")
    
    return f"Message sent to {receiver} via UI automation." """

new_block = """    # Otherwise, fallback to the direct New Message modal route
    if not _open_browser_url("https://www.instagram.com/direct/new/"):
        return "Could not open Instagram new message modal in browser."
    
    time.sleep(3.5)  # Wait for modal to load and auto-focus search bar

    # 1. The search bar is auto-focused on this URL, so we instantly search the user ID
    _paste_text(receiver)
    time.sleep(2.5)  # Wait for search results to populate
    
    # 2. Tab twice to focus the top search result
    for _ in range(2):
        pyautogui.press("tab")
        time.sleep(0.2)
        
    # 3. Hit enter to select the user
    pyautogui.press("enter")
    time.sleep(0.5)

    # 4. Tab once to focus the "Chat" button at the bottom of the modal, and hit enter
    pyautogui.press("tab")
    time.sleep(0.2)
    pyautogui.press("enter")
    
    time.sleep(2.0)  # Wait for the chat window to open
    
    # 5. Type message and hit enter
    _paste_text(message)
    time.sleep(0.2)
    pyautogui.press("enter")
    
    return f"Message sent to {receiver} via robust direct URL UI automation." """

if old_block in code:
    code = code.replace(old_block, new_block)
    with open("luna_message.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("Updated luna_message.py!")
else:
    print("Could not find the block to replace!")
