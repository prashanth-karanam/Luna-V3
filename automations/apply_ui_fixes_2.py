import re

html_path = "index.html"
css_path = "style.css"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Fix the giant blurry block behind the input area
html = html.replace(
    '<div class="input-area" style="display: flex; justify-content: center; background: transparent; border: none; padding-bottom: 20px; z-index: 100;">',
    '<div class="input-area" style="display: flex; justify-content: center; background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none; border: none; padding-bottom: 20px; z-index: 100;">'
)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# 1. Expand AI-Input width and limit max-width
css = re.sub(
    r'\.AI-Input\s*\{[^\}]*max-width:\s*40em;[^\}]*\}',
    '''.AI-Input {
  --primary-color: #2e2e2e;
  --neutral-color: #d3d3d3;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
  width: 95%;
  max-width: 800px;
  user-select: none;
  z-index: 10;
}''',
    css
)

# 2. Make the marquee bubbles slightly opaque and add margin below them
css = re.sub(
    r'\.chat-marquee\s*>\s*ul\s*>\s*li\s*\{[^}]*\}',
    '''.chat-marquee > ul > li {
  padding: 0.5rem 1rem;
  background-color: rgba(30, 30, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: #ececec;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  backdrop-filter: blur(10px);
}''',
    css
)

# 3. Increase space between marquee and the chat container
css = re.sub(
    r'(\.chat-marquee\s*\{.*?)margin-bottom:\s*1rem;(.*?)\}',
    r'\1margin-bottom: 1.5rem;\2}',
    css, flags=re.DOTALL
)
css = re.sub(
    r'(\.chat-marquee\s*\{.*?)margin-bottom:\s*0\.6rem;(.*?)\}',
    r'\1margin-bottom: 1.5rem;\2}',
    css, flags=re.DOTALL
)


# 4. Make the input area shorter vertically
css = re.sub(
    r'(\#msgInput\s*\{.*?)min-height:\s*3rem;(.*?)\}',
    r'\1min-height: 1.5rem;\2}',
    css, flags=re.DOTALL
)

css = re.sub(
    r'(\.chat-wrapper\s*\{.*?padding:\s*)1rem(;.*?\})',
    r'\1 0.6rem 1rem \2',
    css, flags=re.DOTALL
)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Applied UI fixes.")
