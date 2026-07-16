import sys

modals_path = "src/modals.js"
with open(modals_path, "r", encoding="utf-8") as f:
    modals = f.read()

# Replace the Advanced API section in tab-analytics
new_api_section = """
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:25px 0;">
          
          <h3 style="color:var(--blue); margin-top:0; margin-bottom:15px; font-family:'Orbitron',sans-serif; letter-spacing:1px; font-size:1rem;">CLOUD API CONFIGURATION</h3>
          <p style="color:var(--dim); font-size:0.85rem; line-height:1.4; margin-bottom:15px;">Add your OpenAI, Groq, or Gemini API key to activate Cloud Automation routing.</p>
          
          <div class="setting-item" style="flex-direction:column; align-items:flex-start; margin-bottom:20px; background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; border:1px solid rgba(0,180,255,0.2);">
            
            <div style="font-size:0.8rem; color:var(--dim); margin-bottom:5px;">Master API Key (Auto-Detects Provider)</div>
            <input type="password" id="masterApiKey" placeholder="sk-..., AIza..., or gsk_..." style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(0,180,255,0.3); background:rgba(0,0,0,0.5); color:#fff; outline:none; margin-bottom:10px;" />
            
            <div style="font-size:0.8rem; color:var(--dim); margin-bottom:5px;">Key Pool (Optional: Fallback Keys)</div>
            <textarea id="masterApiPool" placeholder="Add extra keys here (one per line) to prevent rate limiting..." style="width:100%; height:60px; padding:10px; border-radius:8px; border:1px solid rgba(0,180,255,0.3); background:rgba(0,0,0,0.5); color:#fff; outline:none; margin-bottom:10px; font-family:monospace; font-size:0.8rem; resize:vertical;"></textarea>
            
            <div style="display:flex; gap:10px; width:100%;">
              <button id="verifyMasterKeyBtn" class="btn-outline" style="flex:1; padding:8px; border-radius:8px; font-size:0.85rem;">Save & Detect Model</button>
              <select id="masterApiModel" class="setting-select" style="flex:2;">
                 <option value="gpt-4o-mini">OpenAI: GPT-4o-Mini</option>
                 <option value="gpt-4o">OpenAI: GPT-4o</option>
                 <option value="gemini-2.5-flash">Gemini: 2.5 Flash</option>
                 <option value="gemini-2.5-pro">Gemini: 2.5 Pro</option>
                 <option value="llama-3.1-8b-instant">Groq: Llama 3.1 8B</option>
                 <option value="llama-3.3-70b-versatile">Groq: Llama 3.3 70B</option>
              </select>
            </div>
            <div id="masterKeyStatus" style="font-size:0.8rem; margin-top:8px; color:var(--dim);">Status: Not configured</div>
          </div>
"""

# Extract the old advanced api section from modals and replace it
# The old section starts around line 169 (hr) and goes down to line 214 (end of Groq Custom Key div)
start_str = '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:25px 0;">'
end_str = '<!-- End Groq Custom Key -->'

if "CLOUD API CONFIGURATION" not in modals:
    # We will just split and replace based on known strings
    # We need to find the <hr> after tokensAll
    # And replace everything from that <hr> to the closing </div> of the tab-analytics
    # Let's use regex
    import re
    modals = re.sub(
        r'<hr style="border:none; border-top:1px solid rgba\(255,255,255,0\.1\); margin:25px 0;">.*?</div>\s*</div>\s*</div>\s*<div class="tab-panel"',
        new_api_section + '\n      </div>\n      <div class="tab-panel"',
        modals,
        flags=re.DOTALL
    )

with open(modals_path, "w", encoding="utf-8") as f:
    f.write(modals)

print("Modals refactored.")
