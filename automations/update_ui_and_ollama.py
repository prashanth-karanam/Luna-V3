import re
import sys

# 1. FIX MODALS.JS
with open("src/modals.js", "r", encoding="utf-8") as f:
    modals = f.read()

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
          
          <button id="toggleAdvancedApiBtn" style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:var(--dim); padding:8px 15px; border-radius:8px; cursor:pointer; font-size:0.85rem; margin-bottom:15px; width:100%; text-align:left;">â–¶ Show Advanced API Settings (Individual Providers)</button>
          
          <div id="advancedApiSection" style="display:none;">
"""

# Replace the start of ADVANCED: CUSTOM API KEYS
modals = re.sub(
    r'<h3[^>]*>ADVANCED: CUSTOM API KEYS</h3>\s*<p[^>]*>Override the built-in Luna cloud with your own API Keys\. You will have unlimited usage\.</p>',
    new_api_section,
    modals
)

# Find the end of Groq section and close the advanced block
groq_end_regex = r'<div id="groqKeyStatus"[^>]*>Status: Using System Pool</div>\s*</div>'
modals = re.sub(groq_end_regex, r'\g<0>\n          </div> <!-- End Advanced Section -->', modals)

with open("src/modals.js", "w", encoding="utf-8") as f:
    f.write(modals)

# 2. FIX APP.JS Ollama and Logic
with open("src/app.js", "r", encoding="utf-8") as f:
    app_js = f.read()

# Add the UI listener for the Advanced toggle
toggle_script = """
document.getElementById('toggleAdvancedApiBtn')?.addEventListener('click', (e) => {
    const sec = document.getElementById('advancedApiSection');
    if (sec.style.display === 'none') {
        sec.style.display = 'block';
        e.target.textContent = 'â–¼ Hide Advanced API Settings';
    } else {
        sec.style.display = 'none';
        e.target.textContent = 'â–¶ Show Advanced API Settings (Individual Providers)';
    }
});
"""

# Insert the toggle script near the master verify button
app_js = app_js.replace("document.getElementById('verifyMasterKeyBtn')?.addEventListener('click', async () => {", toggle_script + "\ndocument.getElementById('verifyMasterKeyBtn')?.addEventListener('click', async () => {")

# Fix Ollama System Prompt & Vision bug
ollama_fix = """
async function callOllama(userText, sysPrompt = null) {
  // Truncate sysPrompt heavily for local models to prevent hallucinations (unless specifically requested via a tool)
  if (!sysPrompt) {
    sysPrompt = "You are Luna, a helpful AI assistant. Answer accurately and concisely. Output your final response in plain text.";
  }

  let messages = [{ role: 'system', content: sysPrompt }];
  let recentHistory = getCleanedHistory().slice(-state.maxContext);
  
  const activeModel = attachedImageBase64 ? 'minicpm-v:latest' : (cfg.optMode || 'qwythos-9b:latest');
  
  for (let msg of recentHistory) {
    if (msg.role === 'user') {
      let content = msg.text;
      let messageObj = { role: 'user', content: content };
      // ONLY attach images if the model is minicpm-v, otherwise small models will crash or output [object Object]
      if (msg === recentHistory[recentHistory.length - 1] && attachedImageBase64 && activeModel.includes('minicpm-v')) {
         messageObj.images = [attachedImageBase64]; 
      }
"""
app_js = re.sub(r'async function callOllama\(userText, sysPrompt = null\) \{.*?(?=      messages\.push\(messageObj\);)', ollama_fix, app_js, flags=re.DOTALL)

with open("src/app.js", "w", encoding="utf-8") as f:
    f.write(app_js)

print("Modals and App updated successfully.")
