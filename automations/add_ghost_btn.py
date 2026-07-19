import re

# 1. Update modals.js to add the button
with open("src/modals.js", "r", encoding="utf-8") as f:
    modals = f.read()

# We will add it right above "Save Settings" or under Master API Pool
pool_html = """<div id="masterKeyStatus" style="font-size:0.8rem; margin-top:8px; color:var(--dim);">Status: Not configured</div>
          </div>"""

new_pool_html = """<div id="masterKeyStatus" style="font-size:0.8rem; margin-top:8px; color:var(--dim);">Status: Not configured</div>
          </div>
          
          <div class="setting-item" style="flex-direction:column; align-items:flex-start; margin-bottom:20px; background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; border:1px solid rgba(0,180,255,0.2);">
            <div style="font-size:0.85rem; color:var(--blue); font-weight:bold; margin-bottom:5px;">GHOST BROWSER AUTHENTICATION</div>
            <p style="color:var(--dim); font-size:0.8rem; line-height:1.4; margin-bottom:10px;">Launch the invisible backend browser in visible mode to pre-login to websites (Instagram, Twitter, etc.) before using silent automations.</p>
            <button id="ghostLoginBtn" class="btn-outline" style="width:100%; padding:10px; border-radius:8px; font-size:0.85rem; border-color:var(--blue); color:var(--blue);">Launch Ghost Browser</button>
          </div>"""

if pool_html in modals:
    modals = modals.replace(pool_html, new_pool_html)
    with open("src/modals.js", "w", encoding="utf-8") as f:
        f.write(modals)
    print("Updated modals.js")
else:
    print("Could not find anchor in modals.js")

# 2. Update app.js to add the event listener
with open("src/app.js", "r", encoding="utf-8") as f:
    app = f.read()

listener_code = """
if ($('ghostLoginBtn')) {
    $('ghostLoginBtn').addEventListener('click', () => {
        if (window.electronAPI) {
            window.electronAPI.executeCode('cmd', 'start python luna_message.py login');
            if (typeof showToast === 'function') showToast('Launching Ghost Browser...', false);
        }
    });
}
"""

# Append listener code near the end of the file or near other UI bindings
if "if ($('saveSettings'))" in app:
    app = app.replace("if ($('saveSettings'))", listener_code + "\nif ($('saveSettings'))")
    with open("src/app.js", "w", encoding="utf-8") as f:
        f.write(app)
    print("Updated app.js")
else:
    print("Could not find anchor in app.js")
