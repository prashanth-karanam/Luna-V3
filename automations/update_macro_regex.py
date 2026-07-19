import re

with open("luna_message.py", "r", encoding="utf-8") as f:
    code = f.read()

# We want to replace everything from the start of the fallback up to the return statement.
# We will use regex to capture the entire block.
pattern = r"# Otherwise, fallback to the 4-tab search method.*?return f\"Message sent to \{receiver\} via UI automation\.\""

new_block = """# Otherwise, navigate directly to the New Message modal to bypass UI notifications
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
    
    return f"Message sent to {receiver} via direct UI modal."""

code = re.sub(pattern, new_block, code, flags=re.DOTALL)

with open("luna_message.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated luna_message.py via regex!")
