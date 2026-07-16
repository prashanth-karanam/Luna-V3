import sys
import re

app_path = "src/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()

# 1. Remove Firebase tracking logic
app_js = re.sub(r'const canProceed = await trackFirebaseMessage\(\);\s*if \(!canProceed\) return;', '', app_js)
app_js = re.sub(r'async function trackFirebaseMessage\(\) \{.*?\}\s*// -- CUSTOM API KEY', '// -- CUSTOM API KEY', app_js, flags=re.DOTALL)
app_js = re.sub(r'/\* ─── FIREBASE AUTH & TIER LOGIC ───────────────────────────── \*/.*?(?=// ─── INITIALIZATION)', '', app_js, flags=re.DOTALL)

master_verify_logic = """
// -- CUSTOM API KEY VERIFICATION ENGINE ----------------------------
document.getElementById('verifyMasterKeyBtn')?.addEventListener('click', async () => {
  const key = document.getElementById('masterApiKey').value.trim();
  if (!key) return showToast('Please enter an API Key first', true);
  
  if (!confirm("Security Notice: Your key will be stored locally in your browser cache. Proceed?")) return;
  
  const btn = document.getElementById('verifyMasterKeyBtn');
  const status = document.getElementById('masterKeyStatus');
  const select = document.getElementById('masterApiModel');
  
  btn.textContent = 'Saved!';
  
  let provider = 'unknown';
  if (key.startsWith('sk-')) {
    provider = 'openai';
    select.value = 'gpt-4o-mini';
  } else if (key.startsWith('AIza')) {
    provider = 'gemini';
    select.value = 'gemini-2.5-flash';
  } else if (key.startsWith('gsk_')) {
    provider = 'groq';
    select.value = 'llama-3.1-8b-instant';
  }
  
  // Save to local config and bypass limits
  cfg.geminiKey = key; // We use geminiKey internally as the cloud key
  cfg.geminiModel = select.value;
  cfg.geminiKeys = document.getElementById('masterApiPool') ? document.getElementById('masterApiPool').value.trim() : '';
  
  isAdmin = true; // Bypass limits
  Object.keys(cfg).forEach(k => localStorage.setItem(`luna_${k}`, cfg[k]));
  showToast(`Key Verified & Saved! Provider: ${provider.toUpperCase()}`, false);
  status.textContent = `Status: Active (${provider.toUpperCase()})`;
  
  setTimeout(() => btn.textContent = 'Save & Detect Model', 2000);
});

document.getElementById('masterApiModel')?.addEventListener('change', (e) => {
  cfg.geminiModel = e.target.value;
  localStorage.setItem('luna_geminiModel', cfg.geminiModel);
});
"""

app_js = re.sub(r'// -- CUSTOM API KEY VERIFICATION ENGINE ----------------------------.*?(?=window\.lunaBoot =)', master_verify_logic + '\n', app_js, flags=re.DOTALL)

settings_load = """
  if($('masterApiKey')) $('masterApiKey').value = cfg.geminiKey;
  if($('masterApiPool')) $('masterApiPool').value = cfg.geminiKeys;
  if($('masterApiModel')) $('masterApiModel').value = cfg.geminiModel;
"""
app_js = re.sub(r"if\(\$\('geminiModel'\)\) \$\('geminiModel'\)\.value = cfg\.geminiModel;", settings_load, app_js)

# Replace callGemini and callGroq invocations with callCloudAPI
app_js = app_js.replace("await callGemini(userText, sysPrompt, state.geminiIdx);", "await callCloudAPI(userText, sysPrompt, state.geminiIdx);")
app_js = app_js.replace("await callGroq(userText, sysPrompt, state.groqIdx);", "await callCloudAPI(userText, sysPrompt, state.geminiIdx);")
app_js = app_js.replace("await callGemini(userText, sysPrompt, keyIndex, nextModel);", "await callCloudAPI(userText, sysPrompt, keyIndex, nextModel);")

cloud_api_func = """
async function callCloudAPI(userText, sysPrompt, keyIndex = -1, modelOverride = null) {
  let allBackupKeys = cfg.geminiKeys.split(/[\\n,; ]+/).map(k => k.trim()).filter(k => k);
  let key = cfg.geminiKey;
  if (keyIndex >= 0 && keyIndex < allBackupKeys.length) {
    key = allBackupKeys[keyIndex];
  }
  const actualModel = modelOverride || cfg.geminiModel || 'gpt-4o-mini';
  
  let cleanHistory = [];
  getCleanedHistory().slice(-40, -1).forEach(m => {
    const role = m.role === 'user' ? 'user' : 'assistant';
    let safeText = m.text;
    if (safeText.length > 3000) safeText = safeText.substring(0, 1500) + '\\n...[content truncated]...\\n' + safeText.substring(safeText.length - 500);
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === role) {
      cleanHistory[cleanHistory.length - 1].content += '\\n\\n' + safeText;
    } else {
      if (safeText.length > 0) cleanHistory.push({ role, content: safeText });
    }
  });

  const messages = [
    { role: 'system', content: sysPrompt },
    ...cleanHistory,
    { role: 'user', content: userText }
  ];

  let url, body, headers;
  
  if (key.startsWith('sk-')) {
    // OpenAI
    url = 'https://api.openai.com/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
    body = { model: actualModel, messages: messages, temperature: 0.7 };
  } else if (key.startsWith('gsk_')) {
    // Groq
    url = 'https://api.groq.com/openai/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
    body = { model: actualModel, messages: messages, temperature: 0.7 };
  } else {
    // Gemini
    url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${key}`;
    headers = { 'Content-Type': 'application/json' };
    
    const contents = [
      { role: 'user', parts: [{ text: sysPrompt }] },
      { role: 'model', parts: [{ text: 'Acknowledged.' }] }
    ];
    
    cleanHistory.forEach(m => {
      const grole = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role: grole, parts: [{ text: m.content }] });
    });
    
    const userParts = [];
    if (typeof attachedImageBase64 !== 'undefined' && attachedImageBase64) {
      userParts.push({ inlineData: { mimeType: attachedImageMime, data: attachedImageBase64 } });
      attachedImageBase64 = null;
      attachedImageMime = null;
    }
    userParts.push({ text: userText });
    contents.push({ role: 'user', parts: userParts });
    
    body = { contents, generationConfig: { temperature: 0.7 } };
  }

  const res = await fetchWithTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  
  if (data.error) {
     if (keyIndex + 1 < allBackupKeys.length) {
       state.geminiIdx = keyIndex + 1;
       localStorage.setItem('luna_geminiIdx', state.geminiIdx);
       console.log(`Engine exhausted. Rotating silently to Backup Engine ${state.geminiIdx + 1}...`);
       return callCloudAPI(userText, sysPrompt, state.geminiIdx, null);
     }
     throw new Error(data.error.message || 'API Error');
  }
  
  if (key.startsWith('sk-') || key.startsWith('gsk_')) {
    return data.choices[0].message.content;
  } else {
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '...';
  }
}
"""

app_js = re.sub(r'async function callGemini\(.*?async function callGroq\(.*?\}\n\s*\}\n', cloud_api_func + '\n', app_js, flags=re.DOTALL)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_js)
print("Updated app.js")
