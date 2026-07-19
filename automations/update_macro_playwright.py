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
"""

new_code = before_func + "def _send_instagram(receiver: str, message: str) -> str:" + new_func_body + after_func

# Now append the CLI block at the very end
cli_block = """

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
"""

if "if __name__ == " not in new_code:
    new_code += cli_block

with open("luna_message.py", "w", encoding="utf-8") as f:
    f.write(new_code)

print("Successfully replaced _send_instagram with Ghost Browser Playwright!")
