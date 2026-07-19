import re

with open('style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update .input-area
content = re.sub(
    r'\.input-area \{[^}]+\}',
    '.input-area { flex-shrink: 0; padding: 10px 18px 20px; background: transparent; border-top: none; }',
    content
)

# 2. Hide chatOrbArea and input-footer
hide_css = """

/* User Requested Tweaks */
#chatOrbArea { display: none !important; }
.input-footer { display: none !important; }

"""
if '/* User Requested Tweaks */' not in content:
    content += hide_css

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(content)
