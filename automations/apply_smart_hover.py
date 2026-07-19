import re

css_path = "style.css"
js_path = "src/app.js"

# 1. Update style.css to remove pure CSS hover triggers and add .flipped class
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

new_trigger = """.menu-container:has(#menuToggle:checked) .flip-card-inner,
.flip-card.flipped .flip-card-inner {"""

css = re.sub(
    r'\.menu-container:has\(#menuToggle:checked\) \.flip-card-inner,\s*\.menu-container:has\(\.menu-btn:hover\) \.flip-card-inner,\s*\.menu-container:has\(\.flip-card:hover\) \.flip-card-inner\s*\{',
    new_trigger,
    css
)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)


# 2. Append JS logic to app.js
smart_hover_js = """

// Smart Menu Hover Logic
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const menuBtn = document.querySelector('.menu-btn');
    const flipCard = document.querySelector('.flip-card');
    if (menuBtn && flipCard) {
      let hoverTimer;
      menuBtn.addEventListener('mouseenter', () => {
          flipCard.classList.add('flipped');
      });
      menuBtn.addEventListener('mouseleave', () => {
          // Grace period for moving mouse across the gap
          hoverTimer = setTimeout(() => {
              flipCard.classList.remove('flipped');
          }, 300);
      });
      flipCard.addEventListener('mouseenter', () => {
          clearTimeout(hoverTimer);
      });
      flipCard.addEventListener('mouseleave', () => {
          flipCard.classList.remove('flipped');
      });
    }
  }, 1000); // Give DOM a second to mount components if needed
});
"""

with open(js_path, "a", encoding="utf-8") as f:
    f.write(smart_hover_js)

print("Applied smart hover JS logic.")
