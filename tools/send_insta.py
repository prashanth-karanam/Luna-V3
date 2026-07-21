import os
from playwright.sync_api import sync_playwright
import time

def send_instagram_msg(username, message):
    with sync_playwright() as p:
        chrome_path = p.chromium.executable_path
        user_data = os.path.join(os.environ.get('APPDATA', ''), 'LunaAI', 'AutomationProfile')
        
        # Launch persistent context as a popup (headless=False)
        context = p.chromium.launch_persistent_context(
            user_data_dir=user_data,
            executable_path=chrome_path,
            headless=False,
            no_viewport=True,
            args=["--window-size=800,600"]
        )
        
        page = context.pages[0] if len(context.pages) > 0 else context.new_page()
        
        print(f"Navigating to Instagram Direct for {username}...")
        # Note: If the user is not logged in, this will show the login screen.
        page.goto(f"https://www.instagram.com/direct/new/")
        
        # We wait 5 seconds to let the user see the screen.
        # If they need to login, they can do it manually or we just log that we reached the page.
        time.sleep(5)
        
        try:
            # Check if login is required (if we see a login button)
            if page.locator("input[name='username']").is_visible():
                print("Login required to send message. Please log in on the browser window.")
                time.sleep(10) # give them a moment
            else:
                # Type username in 'To:' field
                page.fill("input[name='queryBox']", username)
                time.sleep(2)
                # Click the first result
                page.click("text=" + username)
                time.sleep(1)
                # Click 'Chat' button
                page.click("text=Chat")
                time.sleep(3)
                
                # Type message
                page.fill("div[role='textbox']", message)
                time.sleep(1)
                page.keyboard.press("Enter")
                print(f"Sent message to {username}: {message}")
                
        except Exception as e:
            print("Could not automate sending the message (possibly layout changes or login required):", e)
            
        context.close()

if __name__ == "__main__":
    send_instagram_msg("jrntr", "im coming")
