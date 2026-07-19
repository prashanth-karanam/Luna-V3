import re

html_path = "index.html"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Replace the Orb Animation in COL 1 with Daily News (keeping height 200px)
html = html.replace(
    '<div class="placeholder-card" style="height: 200px;">Orb Animation Here</div>',
    '<div class="placeholder-card" style="height: 200px;">Daily News<br><span style="font-size:0.6rem;opacity:0.7">(updating every 3 hrs)</span></div>'
)

# 2. Replace the Daily News in COL 2 with Orb Animation (increasing height to 300px)
html = html.replace(
    '<div class="placeholder-card" style="height: 150px;">Daily News<br><span style="font-size:0.6rem;opacity:0.7">(updating every 3 hrs)</span></div>',
    '<div class="placeholder-card" style="height: 300px;">Orb Animation Here</div>'
)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Applied layout swap.")
