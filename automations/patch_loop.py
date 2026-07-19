import re

with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\src\app.js", "r", encoding="utf-8") as f:
    app = f.read()

# Find the start and end of callCloudAPI
start_str = "async function callCloudAPI(userText, sysPrompt, keyIndex = -1, modelOverride = null, provider = null) {"
end_str = "function updateTokens(count) {"

start_idx = app.find(start_str)
end_idx = app.find(end_str)

new_func = """async function callCloudAPI(userText, sysPrompt, keyIndex = -1, modelOverride = null, provider = null) {
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
  if (primaryKey && !allBackupKeys.includes(primaryKey)) {
    allBackupKeys.unshift(primaryKey); // Ensure primary key is always in the pool
  }
  
  if (allBackupKeys.length === 0) {
    throw new Error("No API keys found. Please enter a key in Settings.");
  }

  const actualModel = activeModel || 'gpt-4o-mini';

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

  let startIdx = keyIndex === -1 ? 0 : keyIndex % allBackupKeys.length;
  let maxAttempts = allBackupKeys.length;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let currentIdx = (startIdx + attempt) % allBackupKeys.length;
    let key = allBackupKeys[currentIdx];
    
    let url, body, headers;
    let requestModel = actualModel;
    
    if (key.startsWith('sk-')) {
      if (!requestModel.includes('gpt') && !requestModel.includes('o1')) requestModel = 'gpt-4o-mini';
      url = 'https://api.openai.com/v1/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
      body = { model: requestModel, messages: messages, temperature: 0.7 };
    } else if (key.startsWith('gsk_')) {
      if (!requestModel.includes('llama') && !requestModel.includes('mixtral') && !requestModel.includes('gemma')) requestModel = 'llama3-8b-8192';
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
      body = { model: requestModel, messages: messages, temperature: 0.7 };
    } else {
      if (!requestModel.includes('gemini')) requestModel = 'gemini-1.5-flash';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${requestModel}:generateContent?key=${key}`;
      headers = { 'Content-Type': 'application/json' };
      let contents = [];
      if (sysPrompt) contents.push({ role: 'user', parts: [{ text: "SYSTEM_PROMPT: " + sysPrompt + "\\n\\nUnderstood." }]});
      cleanHistory.forEach(m => contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      contents.push({ role: 'user', parts: [{ text: userText }] });
      body = { contents, generationConfig: { temperature: 0.7 } };
    }

    let data;
    try {
      const res = await fetchWithTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) });
      data = await res.json();
    } catch (err) {
      console.error(`[LUNA-DEBUG] Network/Timeout error on key ${currentIdx}:`, err);
      data = { error: { message: err.message || 'Network Timeout' } };
    }
    
    if (!data.error) {
      // Success! Update global state to this working index so future calls start here
      state.geminiIdx = currentIdx;
      localStorage.setItem('luna_geminiIdx', currentIdx);
      
      if (key.startsWith('sk-') || key.startsWith('gsk_')) {
        return data.choices[0].message.content;
      } else {
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '...';
      }
    }
    
    // Failed. Log and move to next iteration
    console.log(`[LUNA-DEBUG] Key ${currentIdx} failed. Error:`, data.error.message);
    lastError = data.error.message;
  }
  
  // Exited loop because all keys failed
  throw new Error("All API keys in the pool failed or are invalid. Last error: " + (lastError || "Unknown error"));
}

"""

new_app = app[:start_idx] + new_func + app[end_idx:]

with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\src\app.js", "w", encoding="utf-8") as f:
    f.write(new_app)

print("callCloudAPI looping logic rewritten successfully!")
