import re

html_path = "index.html"
css_path = "style.css"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Replace the opening of workspace-split to insert the 3-column dashboard grid
new_workspace_open = """    <div class="workspace-split dashboard-grid" id="workspaceSplit">
      
      <!-- COL 1 -->
      <div class="dash-col dash-col-1">
        <div class="placeholder-card" style="height: 200px;">Orb Animation Here</div>
        <div class="placeholder-card" style="flex: 1;">Menu</div>
      </div>

      <!-- COL 2 -->
      <div class="dash-col dash-col-2">
        <div class="placeholder-card" style="height: 150px;">Daily News<br><span style="font-size:0.6rem;opacity:0.7">(updating every 3 hrs)</span></div>
        <div class="placeholder-card" style="flex: 1;">Device Information</div>
        <div class="placeholder-card" style="height: 150px;">Terminal Info of Present Chat</div>
      </div>

      <!-- COL 3 (Chat) -->
      <div class="dash-col dash-col-3">
        <!-- CHAT PANE -->
        <div class="chat-pane" id="chatPane">"""

html = html.replace(
    '    <div class="workspace-split" id="workspaceSplit">\n      \n      <!-- CHAT PANE -->\n      <div class="chat-pane" id="chatPane">',
    new_workspace_open
)

# Insert the closing div for dash-col-3
html = html.replace(
    '      </div>\n    </div>\n  </div>',
    '        </div>\n      </div>\n    </div>\n  </div>'
)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)


with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Update .workspace-split and .chat-pane, and add new dashboard CSS
new_css = """
.workspace-split.dashboard-grid {
  flex: 1; display: grid; grid-template-columns: 250px 300px 1fr; gap: 20px; padding: 20px; min-height: 0; width: 100%; box-sizing: border-box;
}

.dash-col {
  display: flex; flex-direction: column; gap: 20px; min-height: 0;
}

.placeholder-card {
  background: rgba(10, 15, 25, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 180, 255, 0.15);
  border-radius: 16px;
  padding: 20px;
  color: var(--dim);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.chat-pane {
  flex: 1; display: flex; flex-direction: column; min-width: 0; height: 100%;
}
"""

# Append the new css at the end of style.css
with open(css_path, "a", encoding="utf-8") as f:
    f.write(new_css)

print("Applied dashboard layout.")
