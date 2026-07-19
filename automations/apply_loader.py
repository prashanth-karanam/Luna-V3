import re

css_path = "style.css"
js_path = "src/app.js"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

loader_css = """
/* Custom 3-Box Loader Animation */
.loader {
  width: 112px;
  height: 112px;
}
.box1, .box2, .box3 {
  border: 16px solid var(--blue);
  box-sizing: border-box;
  position: absolute;
  display: block;
}
.box1 {
  width: 112px; height: 48px; margin-top: 64px; margin-left: 0px;
  animation: abox1 4s 1s forwards ease-in-out infinite;
}
.box2 {
  width: 48px; height: 48px; margin-top: 0px; margin-left: 0px;
  animation: abox2 4s 1s forwards ease-in-out infinite;
}
.box3 {
  width: 48px; height: 48px; margin-top: 0px; margin-left: 64px;
  animation: abox3 4s 1s forwards ease-in-out infinite;
}
@keyframes abox1 {
  0% { width: 112px; height: 48px; margin-top: 64px; margin-left: 0px; }
  12.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  25% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  37.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  50% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  62.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  75% { width: 48px; height: 112px; margin-top: 0px; margin-left: 0px; }
  87.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  100% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
}
@keyframes abox2 {
  0% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  12.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  25% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  37.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  50% { width: 112px; height: 48px; margin-top: 0px; margin-left: 0px; }
  62.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  75% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  87.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  100% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
}
@keyframes abox3 {
  0% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  12.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  25% { width: 48px; height: 112px; margin-top: 0px; margin-left: 64px; }
  37.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  50% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  62.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  75% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  87.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  100% { width: 112px; height: 48px; margin-top: 64px; margin-left: 0px; }
}
"""

if ".loader {" not in css:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write("\n" + loader_css)

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Replace the initial "Luna is thinking..." typing bubble
loader_html = '<div style="display: flex; align-items: center; gap: 10px;"><div class="loader-wrap" style="width: 24px; height: 24px; position: relative;"><div class="loader" style="transform: scale(0.21); transform-origin: top left; position: absolute; top: 0; left: 0;"><div class="box1"></div><div class="box2"></div><div class="box3"></div></div></div><span id="luna-typing" style="font-style:italic;color:var(--dim);">Luna is thinking... <span id="luna-typing-timer" style="font-family:monospace;font-size:0.8rem;">[0.0s]</span></span></div>'
js = re.sub(
    r'addBubble\(\'luna\', \'<span id="luna-typing"[^>]*>Luna is thinking\.\.\. <span id="luna-typing-timer"[^>]*>\[0\.0s\]</span></span>\'\);',
    f"addBubble('luna', '{loader_html}');",
    js
)

# Replace the summaryText for the parsed thought block
thought_loader_html = '<div style="display: inline-flex; align-items: center; gap: 8px;"><div class="loader-wrap" style="width: 16px; height: 16px; position: relative; margin-right: 2px;"><div class="loader" style="transform: scale(0.14); transform-origin: top left; position: absolute; top: 0; left: 0;"><div class="box1"></div><div class="box2"></div><div class="box3"></div></div></div>Luna is thinking...</div>'
js = re.sub(
    r'let summaryText = "Luna is thinking\.\.\.";',
    f"let summaryText = '{thought_loader_html}';",
    js
)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

print("Applied custom box loader animation.")
