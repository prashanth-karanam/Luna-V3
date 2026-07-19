import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the old circle-arrow SVG in sendBtn with a sleek simple arrow
old_svg = r'<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="var\(--neutral-color\)" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0m-7.5 3.5a\.5\.5 0 0 1-1 0V5\.707L5\.354 7\.854a\.5\.5 0 1 1-\.708-\.708l3-3a\.5\.5 0 0 1 \.708 0l3 3a\.5\.5 0 0 1-\.708\.708L8\.5 5\.707z"></path></svg>'
new_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>'

html = re.sub(old_svg, new_svg, html)

# If it didn't match perfectly, let's just do a more generic replacement
if new_svg not in html:
    # Try to find the sendBtn button specifically
    html = re.sub(r'(<button class="send-btn" id="sendBtn"[^>]*>)\s*<svg.*?</svg>\s*(</button>)', r'\1' + new_svg + r'\2', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Hide chatOrbArea
if '#chatOrbArea { display: none !important; }' not in css:
    css += '\n#chatOrbArea { display: none !important; }\n'
    
# Make sure the send button stroke matches instead of fill
css = css.replace('.send-btn > svg { fill: #ececec;', '.send-btn > svg { stroke: #ececec; fill: none;')
css = css.replace('.send-btn:hover > svg { fill: #111;', '.send-btn:hover > svg { stroke: #111; fill: none;')

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)
