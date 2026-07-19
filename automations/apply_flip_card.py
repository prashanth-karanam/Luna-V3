import re

html_path = "index.html"
css_path = "style.css"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Replace <div class="menu-expanded"> with the flip card structure
new_flip_card_open = """            <div class="flip-card">
              <div class="flip-card-inner">
                <div class="flip-card-front">
                  <div style="text-align:center; opacity: 0.6;">
                    <svg viewBox="0 0 175 80" width="60" height="60" style="margin-bottom: 15px;">
                        <rect width="80" height="15" fill="var(--blue)" rx="10"></rect>
                        <rect y="30" width="80" height="15" fill="var(--blue)" rx="10"></rect>
                        <rect y="60" width="80" height="15" fill="var(--blue)" rx="10"></rect>
                    </svg>
                    <p style="font-family:'Orbitron', sans-serif; font-size: 0.9rem; letter-spacing: 2px; color: var(--blue);">LUNA OS</p>
                  </div>
                </div>
                <div class="flip-card-back">"""

html = html.replace('<div class="menu-expanded">', new_flip_card_open)

# Close the flip card divs
# The original closed with </div></div></div> (menu-article, menu-expanded, menu-container)
html = html.replace('</article>\n            </div>\n          </div>', '</article>\n                </div>\n              </div>\n            </div>\n          </div>')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace .menu-expanded CSS with .flip-card CSS
css = re.sub(r'\.menu-expanded\s*\{.*?\}', '', css, flags=re.DOTALL)
css = re.sub(r'\#menuToggle:checked\s*~\s*\.menu-expanded\s*\{.*?\}', '', css, flags=re.DOTALL)

flip_card_css = """
/* 3D Flip Card replacing the old sliding menu-expanded */
.flip-card {
  background-color: transparent;
  width: 100%;
  max-width: 250px;
  height: 290px;
  perspective: 1000px;
  margin-top: 15px;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

/* User explicitly requested: flip when hovering OR clicking the menu toggle button. Not the card itself. */
#menuToggle:checked ~ .flip-card .flip-card-inner,
.menu-btn:hover ~ .flip-card .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front, .flip-card-back {
  box-shadow: 0 10px 25px 0 rgba(0,0,0,0.4);
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  background: rgba(10, 15, 25, 0.7);
  backdrop-filter: blur(15px);
}

.flip-card-front {
  background: linear-gradient(135deg, rgba(30, 35, 45, 0.6), rgba(10, 15, 25, 0.8));
}

.flip-card-back {
  transform: rotateY(180deg);
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  padding: 0;
}
"""

with open(css_path, "a", encoding="utf-8") as f:
    f.write(flip_card_css)

print("Applied flip card styling.")
