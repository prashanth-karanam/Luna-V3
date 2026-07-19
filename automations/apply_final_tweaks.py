import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the old Luna may make mistakes
html = html.replace('<span>Luna may make mistakes</span>', '')

# Insert the new Luna may make mistakes inside .chat-wrapper, just before its closing div
# The .chat-wrapper ends right before the closing of .chat-container.
# Let's find: </div>\n          </div>\n        </div>\n      </label>\n      <div class="input-footer">
# Wait, let's just use regex to find the end of .button-bar and insert it after.
button_bar_end = r'(<div class="right-buttons">\s*<input id="mic" type="checkbox" />\s*<label for="mic">.*?</label>\s*<button class="send-btn" id="sendBtn" title="Send message" disabled>\s*<svg.*?</svg>\s*</button>\s*</div>\s*</div>)'

new_footer_text = r'\1\n            <div style="font-size: 0.65rem; color: #888; text-align: center; width: 100%; margin-top: 6px;">Luna may make mistakes</div>'

html = re.sub(button_bar_end, new_footer_text, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add display:none to input-footer if not exists
if '.input-footer { display: none !important; }' not in css:
    css += '\n.input-footer { display: none !important; }\n'

# Set margin-bottom: 2px on chat-container
css = re.sub(r'margin-bottom:\s*4px;', 'margin-bottom: 2px;', css)

# Make sure .input-area is transparent and has no padding at the bottom so it doesn't push it up
# Wait, input-area has padding: 10px 18px 16px; originally.
css = re.sub(
    r'\.input-area \{[^}]+\}',
    '.input-area { flex-shrink: 0; padding: 0 18px 0px; background: transparent; border-top: none; }',
    css
)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)
