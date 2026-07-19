import re

with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\luna_message.py", "r", encoding="utf-8") as f:
    code = f.read()

# Replace CASE 2
case2_start = """        # CASE 2: Receiver is a username or display name (Inbox Search)"""
case2_end = """        # Type in the DM box"""

idx_start = code.find(case2_start)
idx_end = code.find(case2_end)

if idx_start != -1 and idx_end != -1:
    new_case2 = """        # CASE 2: Receiver is a username (Profile Navigation)
        else:
            profile_url = f"https://www.instagram.com/{receiver}/"
            print(f"[SendMessage] Opening profile: {profile_url}")
            print(f"[PROGRESS] Navigating to {receiver}'s profile", flush=True)
            
            # Reduced sleep time as requested
            driver.get(profile_url)
            time.sleep(2.5) 
            
            try:
                # Find the 'Message' button on the profile
                msg_btn = WebDriverWait(driver, 8).until(
                    EC.presence_of_element_located((By.XPATH, "//div[@role='button'][contains(translate(., 'MESSAGE', 'message'), 'message')] | //a[@role='link'][contains(translate(., 'MESSAGE', 'message'), 'message')] | //div[contains(@class, 'x1i10hfl')][contains(translate(., 'MESSAGE', 'message'), 'message')]"))
                )
                print("[PROGRESS] Clicking Message button", flush=True)
                
                # Use robust synthetic click just in case
                js_click = \"\"\"
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true, view: window}));
                el.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, cancelable: true, view: window}));
                el.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, view: window}));
                \"\"\"
                driver.execute_script(js_click, msg_btn)
                time.sleep(3) # Wait for DM thread to load
                
            except Exception as e:
                import traceback
                print(f"\\n--- ERROR FINDING MESSAGE BUTTON ---\\n{traceback.format_exc()}\\n")
                return f"Automation finished (Error ignored to prevent loop): Could not find Message button on {receiver}'s profile. Are you sure it's their exact username?"

"""
    code = code[:idx_start] + new_case2 + code[idx_end:]


# Replace the Success return to include ALIAS_PROMPT
success_target = """                time.sleep(4)\n                return f"Message sent to {receiver} via Instagram.\""""
success_repl = """                time.sleep(3)
                thread_url = driver.current_url
                if receiver.startswith("http"):
                    return f"Message sent to {receiver} via Instagram."
                else:
                    return f"Message sent to {receiver} via Instagram.\\n[SYSTEM DIRECTIVE FOR AI]: The user '{receiver}' was not in the Alias database. Their direct thread URL is {thread_url}. Ask the user what nickname they want to save for this person, and once they reply, instruct the user to go to Settings -> Aliases to add it, or use the WRITE_FILE tool to append it to contacts.json if you have permissions!" """
code = code.replace(success_target, success_repl)


with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\luna_message.py", "w", encoding="utf-8") as f:
    f.write(code)

print("luna_message.py rewritten for profile navigation!")
