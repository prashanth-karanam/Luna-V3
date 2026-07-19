import os
import re

html_path = "index.html"
css_path = "style.css"
js_path = "src/app.js"
loaders_js_path = "src/loaders.js"

# 1. Create src/loaders.js
loaders_js_content = """window.LunaLoaders = {
  currentLoader: 'banter',
  currentColor: 'rgba(200, 200, 200, 0.7)', // default gray color
  templates: {
    'three-box': {
       html: `<div class="loader-wrap" style="width: 24px; height: 24px; position: relative;"><div class="loader" style="transform: scale(0.21); transform-origin: top left; position: absolute; top: 0; left: 0;"><div class="box1"></div><div class="box2"></div><div class="box3"></div></div></div>`
    },
    'banter': {
       html: `<div class="loader-wrap" style="width: 24px; height: 24px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;"><div class="banter-loader" style="transform: scale(0.33); transform-origin: center;"><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div></div></div>`
    }
  },
  getLoaderHtml: function(isTyping = false) {
    const template = this.templates[this.currentLoader].html;
    if (isTyping) {
        return `<div style="display: flex; align-items: center; gap: 10px; --loader-color: ${this.currentColor};">${template}<span id="luna-typing" style="font-style:italic;color:var(--dim);">Luna is thinking... <span id="luna-typing-timer" style="font-family:monospace;font-size:0.8rem;">[0.0s]</span></span></div>`;
    }
    return `<div style="display: inline-flex; align-items: center; gap: 8px; --loader-color: ${this.currentColor}; margin-right: 2px;">${template}Luna is thinking...</div>`;
  }
};
"""
with open(loaders_js_path, "w", encoding="utf-8") as f:
    f.write(loaders_js_content)

# 2. Inject banter CSS into style.css and update three-box color
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Update old loader to use var(--loader-color)
css = re.sub(
    r'\.box1, \.box2, \.box3 \{\s*border: 16px solid var\(--blue\);',
    '.box1, .box2, .box3 {\n  border: 16px solid var(--loader-color, var(--blue));',
    css
)

banter_css = """
/* Banter Loader */
.banter-loader {
  position: relative;
  width: 72px;
  height: 72px;
}
.banter-loader__box {
  float: left;
  position: relative;
  width: 20px;
  height: 20px;
  margin-right: 6px;
}
.banter-loader__box:before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: var(--loader-color, #fff);
  border-radius: 4px;
}
.banter-loader__box:nth-child(3n) { margin-right: 0; margin-bottom: 6px; }
.banter-loader__box:nth-child(1):before, .banter-loader__box:nth-child(4):before { margin-left: 26px; }
.banter-loader__box:nth-child(3):before { margin-top: 52px; }
.banter-loader__box:last-child { margin-bottom: 0; }

@keyframes moveBox-1 { 9.0909% { transform: translate(-26px, 0); } 18.1818% { transform: translate(0px, 0); } 27.2727% { transform: translate(0px, 0); } 36.3636% { transform: translate(26px, 0); } 45.4545% { transform: translate(26px, 26px); } 54.5454% { transform: translate(26px, 26px); } 63.6363% { transform: translate(26px, 26px); } 72.7272% { transform: translate(26px, 0px); } 81.8181% { transform: translate(0px, 0px); } 90.9090% { transform: translate(-26px, 0px); } 100% { transform: translate(0px, 0px); } }
.banter-loader__box:nth-child(1) { animation: moveBox-1 4s infinite; }
@keyframes moveBox-2 { 9.0909% { transform: translate(0, 0); } 18.1818% { transform: translate(26px, 0); } 27.2727% { transform: translate(0px, 0); } 36.3636% { transform: translate(26px, 0); } 45.4545% { transform: translate(26px, 26px); } 54.5454% { transform: translate(26px, 26px); } 63.6363% { transform: translate(26px, 26px); } 72.7272% { transform: translate(26px, 26px); } 81.8181% { transform: translate(0px, 26px); } 90.9090% { transform: translate(0px, 26px); } 100% { transform: translate(0px, 0px); } }
.banter-loader__box:nth-child(2) { animation: moveBox-2 4s infinite; }
@keyframes moveBox-3 { 9.0909% { transform: translate(-26px, 0); } 18.1818% { transform: translate(-26px, 0); } 27.2727% { transform: translate(0px, 0); } 36.3636% { transform: translate(-26px, 0); } 45.4545% { transform: translate(-26px, 0); } 54.5454% { transform: translate(-26px, 0); } 63.6363% { transform: translate(-26px, 0); } 72.7272% { transform: translate(-26px, 0); } 81.8181% { transform: translate(-26px, -26px); } 90.9090% { transform: translate(0px, -26px); } 100% { transform: translate(0px, 0px); } }
.banter-loader__box:nth-child(3) { animation: moveBox-3 4s infinite; }
@keyframes moveBox-4 { 9.0909% { transform: translate(-26px, 0); } 18.1818% { transform: translate(-26px, 0); } 27.2727% { transform: translate(-26px, -26px); } 36.3636% { transform: translate(0px, -26px); } 45.4545% { transform: translate(0px, 0px); } 54.5454% { transform: translate(0px, -26px); } 63.6363% { transform: translate(0px, -26px); } 72.7272% { transform: translate(0px, -26px); } 81.8181% { transform: translate(-26px, -26px); } 90.9090% { transform: translate(-26px, 0px); } 100% { transform: translate(0px, 0px); } }
.banter-loader__box:nth-child(4) { animation: moveBox-4 4s infinite; }
@keyframes moveBox-5 { 9.0909% { transform: translate(0, 0); } 18.1818% { transform: translate(0, 0); } 27.2727% { transform: translate(0, 0); } 36.3636% { transform: translate(26px, 0); } 45.4545% { transform: translate(26px, 0); } 54.5454% { transform: translate(26px, 0); } 63.6363% { transform: translate(26px, 0); } 72.7272% { transform: translate(26px, 0); } 81.8181% { transform: translate(26px, -26px); } 90.9090% { transform: translate(0px, -26px); } 100% { transform: translate(0px, 0px); } }
.banter-loader__box:nth-child(5) { animation: moveBox-5 4s infinite; }
@keyframes moveBox-6 { 9.0909% { transform: translate(0, 0); } 18.1818% { transform: translate(-26px, 0); } 27.2727% { transform: translate(-26px, 0); } 36.3636% { transform: translate(0px, 0); } 45.4545% { transform: translate(0px, 0); } 54.5454% { transform: translate(0px, 0); } 63.6363% { transform: translate(0px, 0); } 72.7272% { transform: translate(0px, 26px); } 81.8181% { transform: translate(-26px, 26px); } 90.9090% { transform: translate(-26px, 0px); } 100% { transform: translate(0px, 0px); } }
.banter-loader__box:nth-child(6) { animation: moveBox-6 4s infinite; }
@keyframes moveBox-7 { 9.0909% { transform: translate(26px, 0); } 18.1818% { transform: translate(26px, 0); } 27.2727% { transform: translate(26px, 0); } 36.3636% { transform: translate(0px, 0); } 45.4545% { transform: translate(0px, -26px); } 54.5454% { transform: translate(26px, -26px); } 63.6363% { transform: translate(0px, -26px); } 72.7272% { transform: translate(0px, -26px); } 81.8181% { transform: translate(0px, 0px); } 90.9090% { transform: translate(26px, 0px); } 100% { transform: translate(0px, 0px); } }
.banter-loader__box:nth-child(7) { animation: moveBox-7 4s infinite; }
@keyframes moveBox-8 { 9.0909% { transform: translate(0, 0); } 18.1818% { transform: translate(-26px, 0); } 27.2727% { transform: translate(-26px, -26px); } 36.3636% { transform: translate(0px, -26px); } 45.4545% { transform: translate(0px, -26px); } 54.5454% { transform: translate(0px, -26px); } 63.6363% { transform: translate(0px, -26px); } 72.7272% { transform: translate(0px, -26px); } 81.8181% { transform: translate(26px, -26px); } 90.9090% { transform: translate(26px, 0px); } 100% { transform: translate(0px, 0px); } }
.banter-loader__box:nth-child(8) { animation: moveBox-8 4s infinite; }
@keyframes moveBox-9 { 9.0909% { transform: translate(-26px, 0); } 18.1818% { transform: translate(-26px, 0); } 27.2727% { transform: translate(0px, 0); } 36.3636% { transform: translate(-26px, 0); } 45.4545% { transform: translate(0px, 0); } 54.5454% { transform: translate(0px, 0); } 63.6363% { transform: translate(-26px, 0); } 72.7272% { transform: translate(-26px, 0); } 81.8181% { transform: translate(-52px, 0); } 90.9090% { transform: translate(-26px, 0); } 100% { transform: translate(0px, 0); } }
.banter-loader__box:nth-child(9) { animation: moveBox-9 4s infinite; }
"""

if ".banter-loader {" not in css:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write("\n" + banter_css)


# 3. Update index.html to load loaders.js
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

if "loaders.js" not in html:
    html = html.replace('<script type="module" src="./src/app.js"></script>', '<script src="./src/loaders.js"></script>\n  <script type="module" src="./src/app.js"></script>')
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

# 4. Update app.js to use LunaLoaders
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# For the typing bubble
js = re.sub(
    r'addBubble\(\'luna\', \'<div style="display: flex; align-items: center; gap: 10px;">.*?\[0\.0s\]</span></span></div>\'\);',
    r"addBubble('luna', window.LunaLoaders.getLoaderHtml(true));",
    js
)

# For the thought block
js = re.sub(
    r'let summaryText = \'<div style="display: inline-flex; align-items: center; gap: 8px;">.*?Luna is thinking\.\.\.</div>\';',
    r"let summaryText = window.LunaLoaders.getLoaderHtml(false);",
    js
)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

print("Applied customizable loader system.")
