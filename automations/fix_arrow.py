import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the current SVG with a solid filled arrow SVG that cannot fail to render
solid_arrow_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" width="16" height="16"><path d="M13 5.414V20h-2V5.414l-5.293 5.293-1.414-1.414L12 1.586l7.707 7.707-1.414 1.414z"/></svg>'

# Find any svg inside the sendBtn
html = re.sub(r'(<button class="send-btn" id="sendBtn"[^>]*>)\s*<svg.*?</svg>\s*(</button>)', r'\1' + solid_arrow_svg + r'\2', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix the CSS so it uses fill instead of stroke for the new solid SVG
css = css.replace('.send-btn > svg { stroke: #ececec; fill: none;', '.send-btn > svg { fill: #ececec;')
css = css.replace('.send-btn:hover > svg { stroke: #111; fill: none;', '.send-btn:hover > svg { fill: #111;')

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)
