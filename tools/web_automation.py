import sys
import json
import subprocess
import time
import os
from playwright.sync_api import sync_playwright

def find_chrome_path():
    paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    ]
    for p in paths:
        if os.path.exists(p):
            return p
    return None

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action provided"}))
        return

    action = sys.argv[1]
    
    with sync_playwright() as p:
        browser = None
        context = None
        page = None
        
        try:
            browser = p.chromium.connect_over_cdp("http://localhost:9222")
            context = browser.contexts[0]
            if len(context.pages) > 0:
                page = context.pages[0]
            else:
                page = context.new_page()
        except Exception as e:
            if action == "status":
                print(json.dumps({"ok": True, "status": "closed"}))
                return
                
            # Need to launch chrome
            chrome_path = find_chrome_path()
            if not chrome_path:
                print(json.dumps({"error": "Chrome or Edge not found"}))
                return
            
            user_data = os.path.join(os.environ.get('APPDATA', ''), 'LunaAI', 'ChromeProfile')
            os.makedirs(user_data, exist_ok=True)
            
            subprocess.Popen([
                chrome_path,
                "--remote-debugging-port=9222",
                f"--user-data-dir={user_data}",
                "--no-first-run",
                "--no-default-browser-check"
            ])
            
            # Wait for it to start
            time.sleep(2)
            try:
                browser = p.chromium.connect_over_cdp("http://localhost:9222")
                context = browser.contexts[0]
                page = context.pages[0] if len(context.pages) > 0 else context.new_page()
            except Exception as e2:
                print(json.dumps({"error": f"Failed to connect to browser: {str(e2)}"}))
                return

        try:
            result = {"ok": True}
            
            if action == "status":
                result["status"] = "open"
                result["url"] = page.url
                result["title"] = page.title()
                
            elif action == "goto":
                url = sys.argv[2]
                page.goto(url, wait_until="domcontentloaded")
                result["message"] = f"Navigated to {url}"
                
            elif action == "click":
                selector = sys.argv[2]
                page.click(selector)
                result["message"] = f"Clicked {selector}"
                
            elif action == "type":
                selector = sys.argv[2]
                text = sys.argv[3]
                page.fill(selector, text)
                result["message"] = f"Typed into {selector}"
                
            elif action == "read":
                text = page.locator("body").inner_text()
                if len(text) > 4000:
                    text = text[:4000] + "...(truncated)"
                result["text"] = text
                
            elif action == "extract":
                selector = sys.argv[2]
                elements = page.locator(selector).all()
                texts = [el.inner_text() for el in elements if el.is_visible()]
                extracted = "\\n".join(texts)
                if len(extracted) > 4000:
                    extracted = extracted[:4000] + "...(truncated)"
                result["text"] = extracted
                
            elif action == "dom_map":
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
                extracted = "\\n".join(output)
                if len(extracted) > 8000:
                    extracted = extracted[:8000] + "...(truncated)"
                result["text"] = extracted if extracted else "No interactive elements found."
                result["message"] = f"Extracted {len(dom_tree)} interactive elements."

            else:
                result = {"error": f"Unknown action: {action}"}
                
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            
        finally:
            if browser:
                browser.close()

if __name__ == "__main__":
    main()
