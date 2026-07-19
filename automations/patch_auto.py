import re

# 1. Update index.html
with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\index.html", "r", encoding="utf-8") as f:
    html = f.read()

html_target = """<!-- ADVANCED TAB -->
        <div id="set-adv" class="cyber-tab-pane" style="padding-top: 10px;">
          
          <div class="cyber-sub-tabs" style="display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 1px solid rgba(0, 180, 255, 0.2); padding-bottom: 5px;">"""

html_repl = """<!-- ADVANCED TAB -->
        <div id="set-adv" class="cyber-tab-pane" style="padding-top: 10px;">
          
          <div class="setting-group">
            <label>Automatic Integration (Dump any API keys here)</label>
            <textarea id="autoApiPool" placeholder="sk-...\\ngsk_...\\nAIza..." class="cyber-input" style="height: 100px; resize: vertical;"></textarea>
            <span style="font-size:0.75rem; color:var(--dim);">System will automatically detect provider (OpenAI, Gemini, Groq) line by line.</span>
          </div>

          <details class="cyber-details" style="margin-bottom: 20px;">
            <summary style="cursor: pointer; padding: 10px; background: rgba(0,180,255,0.05); border: 1px solid rgba(0,180,255,0.2); border-radius: 5px; color: var(--blue); font-family: 'Orbitron', sans-serif; list-style: none;">Manual Integration (Advanced Routing) &#9660;</summary>
            <div style="padding: 15px; border: 1px solid rgba(0,180,255,0.2); border-top: none; border-radius: 0 0 5px 5px; background: rgba(0,0,0,0.3);">
              <div class="cyber-sub-tabs" style="display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 1px solid rgba(0, 180, 255, 0.2); padding-bottom: 5px;">"""

html = html.replace(html_target, html_repl)

html_target2 = """<div class="setting-group" style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px;">"""
html_repl2 = """            </div>
          </details>

          <div class="setting-group" style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px;">"""
html = html.replace(html_target2, html_repl2)

with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\index.html", "w", encoding="utf-8") as f:
    f.write(html)


# 2. Update app.js
with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\src\app.js", "r", encoding="utf-8") as f:
    app = f.read()

cfg_target = """const cfg = {
    openaiKey:    localStorage.getItem('luna_openaiKey')    || '',"""
cfg_repl = """const cfg = {
    autoPool:     localStorage.getItem('luna_autoPool')     || '',
    openaiKey:    localStorage.getItem('luna_openaiKey')    || '',"""
app = app.replace(cfg_target, cfg_repl)

route_target = """else if (cfg.geminiKey) { console.log('[LUNA-DEBUG] [GEMINI] Fallback to Gemini API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx, null, 'gemini'); }
    else reply = '?? APIs not configured.';"""
route_repl = """else if (cfg.geminiKey) { console.log('[LUNA-DEBUG] [GEMINI] Fallback to Gemini API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx, null, 'gemini'); }
    else if (cfg.autoPool) { console.log('[LUNA-DEBUG] [AUTO] Using Automatic Pool...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx, null, 'auto'); }
    else reply = '?? APIs not configured.';"""
app = app.replace(route_target, route_repl)

cloud_target = """async function callCloudAPI(userText, sysPrompt, keyIndex = -1, modelOverride = null, provider = null) {
  let poolString = '';
  let primaryKey = '';
  let activeModel = modelOverride;

  if (provider === 'openai' || (!provider && cfg.openaiKey)) {
    poolString = cfg.openaiKeys; primaryKey = cfg.openaiKey; activeModel = activeModel || cfg.openaiModel || 'gpt-4o-mini';
  } else if (provider === 'groq' || (!provider && cfg.groqKey && !cfg.geminiKey)) {
    poolString = cfg.groqKeys; primaryKey = cfg.groqKey; activeModel = activeModel || cfg.groqModel || 'llama3-8b-8192';
  } else {
    poolString = cfg.geminiKeys; primaryKey = cfg.geminiKey; activeModel = activeModel || cfg.geminiModel || 'gemini-1.5-flash';
  }

  let allBackupKeys = poolString.split(/[\\n,; ]+/).map(k => k.trim()).filter(k => k);
  let key = primaryKey;
  if (keyIndex >= 0 && keyIndex < allBackupKeys.length) {
    key = allBackupKeys[keyIndex];
  }"""
cloud_repl = """async function callCloudAPI(userText, sysPrompt, keyIndex = -1, modelOverride = null, provider = null) {
  let poolString = '';
  let primaryKey = '';
  let activeModel = modelOverride;

  if (provider === 'openai' || (!provider && cfg.openaiKey)) {
    poolString = cfg.openaiKeys + '\\n' + cfg.autoPool; primaryKey = cfg.openaiKey; activeModel = activeModel || cfg.openaiModel || 'gpt-4o-mini';
  } else if (provider === 'groq' || (!provider && cfg.groqKey && !cfg.geminiKey)) {
    poolString = cfg.groqKeys + '\\n' + cfg.autoPool; primaryKey = cfg.groqKey; activeModel = activeModel || cfg.groqModel || 'llama3-8b-8192';
  } else if (provider === 'gemini' || cfg.geminiKey) {
    poolString = cfg.geminiKeys + '\\n' + cfg.autoPool; primaryKey = cfg.geminiKey; activeModel = activeModel || cfg.geminiModel || 'gemini-1.5-flash';
  } else {
    poolString = cfg.autoPool; primaryKey = '';
  }

  let allBackupKeys = poolString.split(/[\\n,; ]+/).map(k => k.trim()).filter(k => k);
  let key = primaryKey;
  if (!key && allBackupKeys.length > 0) {
    key = allBackupKeys[0];
  }
  if (keyIndex >= 0 && keyIndex < allBackupKeys.length) {
    key = allBackupKeys[keyIndex];
  }"""
app = app.replace(cloud_target, cloud_repl)

open_target = """if($('openaiKey')) $('openaiKey').value = cfg.openaiKey;"""
open_repl = """if($('autoApiPool')) $('autoApiPool').value = cfg.autoPool;
  if($('openaiKey')) $('openaiKey').value = cfg.openaiKey;"""
app = app.replace(open_target, open_repl)

save_target = """cfg.openaiKey = $('openaiKey') ? $('openaiKey').value.trim() : '';"""
save_repl = """cfg.autoPool = $('autoApiPool') ? $('autoApiPool').value.trim() : '';
  cfg.openaiKey = $('openaiKey') ? $('openaiKey').value.trim() : '';"""
app = app.replace(save_target, save_repl)

with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\src\app.js", "w", encoding="utf-8") as f:
    f.write(app)

print("HTML and JS patched successfully!")
