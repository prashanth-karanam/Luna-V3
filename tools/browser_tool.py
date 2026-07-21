"""
browser_tool.py — Luna's Universal Browser Automation Tool
Uses Playwright's bundled Chromium as a visible popup window.
NEVER opens Opera, Edge, Chrome, or any system browser.

Usage:
    python browser_tool.py <action> [args...]

Actions:
    open <url>                  — Navigate to a URL
    search <query>              — Google search
    send_dm <platform> <user> <message> — Send a DM (Instagram)
    play <query>                — Play a YouTube video/song
    profile <platform> <user>   — Open a social media profile
    status                      — Check if automation browser is open
    goto <url>                  — Alias for open
    click <selector>            — Click an element
    type <selector> <text>      — Type into an element
    press <key>                 — Press a keyboard key
    read                        — Read page body text
    extract <selector>          — Extract text from elements
    dom_map                     — Map interactive DOM elements
    screenshot [path]           — Take a screenshot
"""

import sys
import json
import time
import os
import subprocess

# ─── Playwright Browser Management ─────────────────────────────────────

def get_browser_config():
    """Returns Playwright Chromium executable path and user data directory."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        chrome_path = p.chromium.executable_path
    user_data = os.path.join(os.environ.get('APPDATA', ''), 'LunaAI', 'AutomationProfile')
    os.makedirs(user_data, exist_ok=True)
    return chrome_path, user_data


def launch_browser():
    """Launch Playwright Chromium with remote debugging and return connected page."""
    from playwright.sync_api import sync_playwright
    p = sync_playwright().start()
    
    # Try connecting to existing browser first
    try:
        browser = p.chromium.connect_over_cdp("http://localhost:9222", timeout=1000)
        context = browser.contexts[0]
        page = context.pages[0] if len(context.pages) > 0 else context.new_page()
        return p, browser, context, page, False
    except Exception:
        pass
    
    # Launch a new Playwright Chromium instance
    chrome_path = p.chromium.executable_path
    user_data = os.path.join(os.environ.get('APPDATA', ''), 'LunaAI', 'AutomationProfile')
    os.makedirs(user_data, exist_ok=True)
    
    subprocess.Popen([
        chrome_path,
        "--remote-debugging-port=9222",
        f"--user-data-dir={user_data}",
        "--no-first-run",
        "--no-default-browser-check",
        "--start-maximized"
    ])
    
    # Wait for it to start
    for attempt in range(5):
        time.sleep(1.5)
        try:
            browser = p.chromium.connect_over_cdp("http://localhost:9222")
            context = browser.contexts[0]
            page = context.pages[0] if len(context.pages) > 0 else context.new_page()
            return p, browser, context, page, True
        except Exception:
            if attempt == 4:
                raise Exception("Failed to connect to Playwright Chromium after 5 attempts")
    
    raise Exception("Failed to launch browser")


def cleanup(p, browser):
    """Disconnect (don't close) the browser."""
    try:
        if browser:
            browser.disconnect()
    except:
        pass
    try:
        if p:
            p.stop()
    except:
        pass


# ─── Actions ────────────────────────────────────────────────────────────

def action_status():
    """Check if automation browser is open."""
    try:
        from playwright.sync_api import sync_playwright
        p = sync_playwright().start()
        try:
            browser = p.chromium.connect_over_cdp("http://localhost:9222", timeout=1000)
            ctx = browser.contexts[0]
            page = ctx.pages[0] if len(ctx.pages) > 0 else None
            result = {
                "ok": True,
                "status": "open",
                "url": page.url if page else "about:blank",
                "title": page.title() if page else ""
            }
            browser.disconnect()
            p.stop()
            return result
        except:
            p.stop()
            return {"ok": True, "status": "closed"}
    except Exception as e:
        return {"ok": True, "status": "closed"}


def action_open(url):
    """Navigate to a URL in the automation browser."""
    p, browser, context, page, fresh = launch_browser()
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        result = {"ok": True, "message": f"Navigated to {url}", "title": page.title()}
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


def action_search(query):
    """Google search in the automation browser."""
    url = f"https://www.google.com/search?q={__import__('urllib.parse', fromlist=['quote']).quote(query)}"
    return action_open(url)


def action_play(query, is_fullscreen=False):
    """Play a YouTube video/song by searching and clicking the first result."""
    from urllib.parse import quote
    p, browser, context, page, fresh = launch_browser()
    try:
        search_url = f"https://www.youtube.com/results?search_query={quote(query)}"
        page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
        
        # Try to accept cookies if banner appears
        try:
            cookie_btn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")')
            if cookie_btn.count() > 0:
                cookie_btn.first.click(timeout=2000)
                time.sleep(1)
        except:
            pass
            
        # Wait for search results container
        try:
            page.wait_for_selector("ytd-video-renderer, ytd-search, #contents", timeout=10000)
        except:
            pass
            
        time.sleep(2)
        
        # Try multiple selectors to find the first video title
        selectors = [
            "ytd-video-renderer a#video-title",
            "a#video-title",
            "a.yt-simple-endpoint.ytd-video-renderer",
            "a[href^='/watch?v=']"
        ]
        
        first_video = None
        for sel in selectors:
            try:
                elem = page.locator(sel).first
                elem.wait_for(state="visible", timeout=3000)
                first_video = elem
                break
            except:
                continue
                
        if first_video:
            video_title = first_video.inner_text()
            first_video.click()
            
            if is_fullscreen:
                # Wait for the video player to actually load before trying to fullscreen
                try:
                    page.wait_for_selector('video', timeout=10000)
                    time.sleep(1) # Extra buffer for player controls
                    
                    # Force true fullscreen via JavaScript API for 100% reliability
                    page.evaluate("document.querySelector('.html5-video-player').requestFullscreen().catch(e => document.querySelector('video').requestFullscreen())")
                    time.sleep(1)
                except:
                    pass
                time.sleep(0.5)
                
            result = {"ok": True, "message": f"Now playing: {video_title}" + (" (Fullscreen)" if is_fullscreen else ""), "url": page.url}
        else:
            result = {"ok": True, "message": f"Opened YouTube search for '{query}', but couldn't auto-click first result (layout changed).", "url": page.url}
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


def action_profile(platform, username):
    """Open a social media profile."""
    platform = platform.lower().strip()
    username = username.strip().lstrip('@')
    
    profile_urls = {
        'instagram': f"https://www.instagram.com/{username}/",
        'insta': f"https://www.instagram.com/{username}/",
        'ig': f"https://www.instagram.com/{username}/",
        'youtube': f"https://www.youtube.com/@{username}",
        'yt': f"https://www.youtube.com/@{username}",
        'twitter': f"https://www.twitter.com/{username}",
        'x': f"https://www.x.com/{username}",
        'github': f"https://www.github.com/{username}",
        'reddit': f"https://www.reddit.com/user/{username}",
        'tiktok': f"https://www.tiktok.com/@{username}",
        'linkedin': f"https://www.linkedin.com/in/{username}",
        'facebook': f"https://www.facebook.com/{username}",
        'fb': f"https://www.facebook.com/{username}",
    }
    
    url = profile_urls.get(platform)
    if not url:
        return {"ok": False, "error": f"Unsupported platform: {platform}. Supported: {', '.join(profile_urls.keys())}"}
    
    return action_open(url)


def action_send_dm(platform, receiver, message):
    """Send a DM on a social media platform via the automation browser."""
    platform = platform.lower().strip()
    receiver = receiver.strip().lstrip('@')
    
    if platform in ['instagram', 'insta', 'ig']:
        return _send_instagram_dm(receiver, message)
    else:
        return {"ok": False, "error": f"DM automation not yet supported for: {platform}. Use SEND_MESSAGE with pyautogui for WhatsApp/Discord/Telegram."}


def _send_instagram_dm(receiver, message):
    """Send an Instagram DM via Playwright automation browser."""
    p, browser, context, page, fresh = launch_browser()
    try:
        # Navigate to the DM page via ig.me shortcut
        page.goto(f"https://ig.me/m/{receiver}", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        
        # Check if login is required
        try:
            if page.locator("input[name='username']").is_visible(timeout=2000):
                cleanup(p, browser)
                return {"ok": False, "error": f"Login required. Please open the Playwright browser and log into Instagram first. Run: python browser_tool.py open https://www.instagram.com/"}
        except:
            pass  # Not on login page, good
        
        # Try to find and fill the message box
        textbox = page.locator("div[role='textbox']")
        try:
            textbox.wait_for(state="visible", timeout=10000)
            textbox.fill(message)
            time.sleep(0.5)
            page.keyboard.press("Enter")
            time.sleep(2)
            result = {"ok": True, "message": f"Sent '{message}' to {receiver} on Instagram."}
        except Exception as inner_e:
            # Fallback: try textarea or content-editable
            try:
                page.locator("textarea").first.fill(message)
                page.keyboard.press("Enter")
                time.sleep(2)
                result = {"ok": True, "message": f"Sent '{message}' to {receiver} on Instagram (fallback)."}
            except:
                result = {"ok": False, "error": f"Could not find message input box. The DM page layout may have changed. Error: {str(inner_e)}"}
        
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    
    cleanup(p, browser)
    return result


def action_click(selector):
    """Click an element on the current page."""
    p, browser, context, page, fresh = launch_browser()
    try:
        page.click(selector, timeout=10000)
        result = {"ok": True, "message": f"Clicked {selector}"}
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


def action_type(selector, text):
    """Type text into an element."""
    p, browser, context, page, fresh = launch_browser()
    try:
        page.fill(selector, text, timeout=10000)
        result = {"ok": True, "message": f"Typed into {selector}"}
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


def action_press(key):
    """Press a keyboard key."""
    p, browser, context, page, fresh = launch_browser()
    try:
        page.keyboard.press(key)
        result = {"ok": True, "message": f"Pressed {key}"}
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


def action_read():
    """Read the body text of the current page."""
    p, browser, context, page, fresh = launch_browser()
    try:
        text = page.locator("body").inner_text()
        if len(text) > 4000:
            text = text[:4000] + "...(truncated)"
        result = {"ok": True, "text": text}
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


def action_extract(selector):
    """Extract text from elements matching selector."""
    p, browser, context, page, fresh = launch_browser()
    try:
        elements = page.locator(selector).all()
        texts = [el.inner_text() for el in elements if el.is_visible()]
        extracted = "\n".join(texts)
        if len(extracted) > 4000:
            extracted = extracted[:4000] + "...(truncated)"
        result = {"ok": True, "text": extracted}
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


def action_dom_map():
    """Map interactive DOM elements on the current page."""
    p, browser, context, page, fresh = launch_browser()
    try:
        js_code = """
        () => {
            const interactiveTags = new Set(['a', 'button', 'input', 'select', 'textarea']);
            let map = [];
            
            function getSelector(el) {
                if (el.id) return `#${el.id}`;
                if (el.hasAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
                let path = [];
                let current = el;
                while (current && current.nodeType === Node.ELEMENT_NODE) {
                    let selector = current.nodeName.toLowerCase();
                    if (current.id) {
                        selector = `#${current.id}`;
                        path.unshift(selector);
                        break;
                    }
                    let sib = current, nth = 1;
                    while (sib = sib.previousElementSibling) {
                        if (sib.nodeName.toLowerCase() === selector) nth++;
                    }
                    if (nth !== 1) selector += `:nth-of-type(${nth})`;
                    path.unshift(selector);
                    current = current.parentNode;
                    if (current === document.body) break;
                }
                return path.join(' > ');
            }

            document.querySelectorAll('*').forEach(el => {
                let style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
                
                let isInteractive = interactiveTags.has(el.tagName.toLowerCase());
                if (el.hasAttribute('role') && ['button', 'link', 'textbox', 'checkbox', 'menuitem'].includes(el.getAttribute('role'))) {
                    isInteractive = true;
                }
                if (el.onclick != null || (el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1')) {
                    isInteractive = true;
                }
                
                if (isInteractive) {
                    let text = (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('alt') || '').trim();
                    text = text.substring(0, 100).replace(/\\n/g, ' ');
                    if (text || el.tagName.toLowerCase() === 'input') {
                        map.push({
                            role: el.getAttribute('role') || el.tagName.toLowerCase(),
                            text: text,
                            selector: getSelector(el)
                        });
                    }
                }
            });
            return map;
        }
        """
        dom_tree = page.evaluate(js_code)
        output = []
        for item in dom_tree:
            output.append(f"Role: {item['role']} | Text: '{item['text']}' | Selector: {item['selector']}")
        extracted = "\n".join(output)
        if len(extracted) > 8000:
            extracted = extracted[:8000] + "...(truncated)"
        result = {
            "ok": True,
            "text": extracted if extracted else "No interactive elements found.",
            "message": f"Extracted {len(dom_tree)} interactive elements."
        }
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


def action_screenshot(save_path=None):
    """Take a screenshot of the current page."""
    p, browser, context, page, fresh = launch_browser()
    try:
        if not save_path:
            save_path = os.path.join(os.environ.get('TEMP', '.'), 'luna_browser_screenshot.png')
        page.screenshot(path=save_path)
        result = {"ok": True, "message": f"Screenshot saved to {save_path}", "path": save_path}
    except Exception as e:
        result = {"ok": False, "error": str(e)}
    cleanup(p, browser)
    return result


# ─── Main Dispatcher ────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action provided. Usage: python browser_tool.py <action> [args...]"}))
        return
    
    action = sys.argv[1].lower()
    
    try:
        if action == "status":
            result = action_status()
        
        elif action in ["open", "goto"]:
            if len(sys.argv) < 3:
                result = {"error": "Usage: browser_tool.py open <url>"}
            else:
                result = action_open(sys.argv[2])
        
        elif action == "search":
            if len(sys.argv) < 3:
                result = {"error": "Usage: browser_tool.py search <query>"}
            else:
                query = " ".join(sys.argv[2:])
                result = action_search(query)
        
        elif action == "play":
            if len(sys.argv) < 3:
                result = {"error": "Usage: browser_tool.py play <query> [fullscreen]"}
            else:
                is_fullscreen = "fullscreen" in sys.argv
                query_args = [arg for arg in sys.argv[2:] if arg != "fullscreen"]
                query = " ".join(query_args)
                result = action_play(query, is_fullscreen)
        
        elif action == "profile":
            if len(sys.argv) < 4:
                result = {"error": "Usage: browser_tool.py profile <platform> <username>"}
            else:
                result = action_profile(sys.argv[2], sys.argv[3])
        
        elif action == "send_dm":
            if len(sys.argv) < 5:
                result = {"error": "Usage: browser_tool.py send_dm <platform> <receiver> <message>"}
            else:
                message = " ".join(sys.argv[4:])
                result = action_send_dm(sys.argv[2], sys.argv[3], message)
        
        elif action == "click":
            if len(sys.argv) < 3:
                result = {"error": "Usage: browser_tool.py click <selector>"}
            else:
                result = action_click(sys.argv[2])
        
        elif action == "type":
            if len(sys.argv) < 4:
                result = {"error": "Usage: browser_tool.py type <selector> <text>"}
            else:
                result = action_type(sys.argv[2], " ".join(sys.argv[3:]))
        
        elif action == "press":
            if len(sys.argv) < 3:
                result = {"error": "Usage: browser_tool.py press <key>"}
            else:
                result = action_press(sys.argv[2])
        
        elif action == "read":
            result = action_read()
        
        elif action == "extract":
            if len(sys.argv) < 3:
                result = {"error": "Usage: browser_tool.py extract <selector>"}
            else:
                result = action_extract(sys.argv[2])
        
        elif action == "dom_map":
            result = action_dom_map()
        
        elif action == "screenshot":
            save_path = sys.argv[2] if len(sys.argv) > 2 else None
            result = action_screenshot(save_path)
        
        else:
            result = {"error": f"Unknown action: {action}. Supported: status, open, goto, search, play, profile, send_dm, click, type, press, read, extract, dom_map, screenshot"}
        
        print(json.dumps(result))
    
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))


if __name__ == "__main__":
    main()
