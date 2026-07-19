import re

with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\src\app.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update cfg object
cfg_target = "const cfg = {\n    geminiKey:"
cfg_repl = "const cfg = {\n    openaiKey:    localStorage.getItem('luna_openaiKey')    || '',\n    openaiKeys:   localStorage.getItem('luna_openaiKeys')   || '',\n    openaiModel:  localStorage.getItem('luna_openaiModel')  || 'gpt-4o-mini',\n    geminiKey:"
content = content.replace(cfg_target, cfg_repl)

# 2. Update engine resolution
engine_target = "const engine = cfg.engine === 'auto' ? (cfg.geminiKey ? 'gemini' : 'groq') : cfg.engine;"
engine_repl = "const engine = cfg.engine === 'auto' ? (cfg.openaiKey ? 'openai' : (cfg.geminiKey ? 'gemini' : 'groq')) : cfg.engine;"
content = content.replace(engine_target, engine_repl)

# 3. Update callAI routing
route_target = "if (activeEngine === 'gemini' && cfg.geminiKey) { console.log('[LUNA-DEBUG] Calling Cloud API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx); }"
route_repl = """if (activeEngine === 'openai' && cfg.openaiKey) { console.log('[LUNA-DEBUG] [OPENAI] Calling OpenAI API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx, null, 'openai'); }
    else if (activeEngine === 'gemini' && cfg.geminiKey) { console.log('[LUNA-DEBUG] [GEMINI] Calling Gemini API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx, null, 'gemini'); }"""
content = content.replace(route_target, route_repl)

fallback_target = "else if (cfg.geminiKey) { console.log('[LUNA-DEBUG] Fallback to Cloud API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx); }"
fallback_repl = """else if (cfg.openaiKey) { console.log('[LUNA-DEBUG] [OPENAI] Fallback to OpenAI API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx, null, 'openai'); }
    else if (cfg.geminiKey) { console.log('[LUNA-DEBUG] [GEMINI] Fallback to Gemini API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx, null, 'gemini'); }"""
content = content.replace(fallback_target, fallback_repl)

groq_route = "reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx);"
content = re.sub(r"console\.log\('\[LUNA-DEBUG\] Sending to Groq\.\.\.'\);\s*reply = await callCloudAPI\(userText, sysPrompt, state\.geminiIdx\);", 
                 "console.log('[LUNA-DEBUG] [GROQ] Calling Groq API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx, null, 'groq');", content)

# 4. Update callCloudAPI signature and pool parsing
cloud_target = """async function callCloudAPI(userText, sysPrompt, keyIndex = -1, modelOverride = null) {
  let allBackupKeys = cfg.geminiKeys.split(/[\\n,; ]+/).map(k => k.trim()).filter(k => k);
  let key = cfg.geminiKey;
  if (keyIndex >= 0 && keyIndex < allBackupKeys.length) {
    key = allBackupKeys[keyIndex];
  }
  const actualModel = modelOverride || cfg.geminiModel || 'gpt-4o-mini';"""

cloud_repl = """async function callCloudAPI(userText, sysPrompt, keyIndex = -1, modelOverride = null, provider = null) {
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
  }
  const actualModel = activeModel;"""
content = content.replace(cloud_target, cloud_repl)

# 5. Update openSettings
open_settings_target = """  $('geminiKey').value = cfg.geminiKey;
  if($('geminiKeys')) $('geminiKeys').value = cfg.geminiKeys;
  $('geminiModel').value = cfg.geminiModel;
  $('groqKey').value = cfg.groqKey;
  if($('groqKeys')) $('groqKeys').value = cfg.groqKeys;
  $('groqModel').value = cfg.groqModel;"""

open_settings_repl = """  if($('openaiKey')) $('openaiKey').value = cfg.openaiKey;
  if($('openaiPool')) $('openaiPool').value = cfg.openaiKeys;
  if($('openaiModel')) $('openaiModel').value = cfg.openaiModel;
  if($('geminiKeyInput')) $('geminiKeyInput').value = cfg.geminiKey;
  if($('geminiPoolInput')) $('geminiPoolInput').value = cfg.geminiKeys;
  if($('geminiModelInput')) $('geminiModelInput').value = cfg.geminiModel;
  if($('groqKeyInput')) $('groqKeyInput').value = cfg.groqKey;
  if($('groqPoolInput')) $('groqPoolInput').value = cfg.groqKeys;
  if($('groqModelInput')) $('groqModelInput').value = cfg.groqModel;
  $('geminiKey').value = cfg.geminiKey;
  if($('geminiKeys')) $('geminiKeys').value = cfg.geminiKeys;
  $('geminiModel').value = cfg.geminiModel;
  $('groqKey').value = cfg.groqKey;
  if($('groqKeys')) $('groqKeys').value = cfg.groqKeys;
  $('groqModel').value = cfg.groqModel;"""
content = content.replace(open_settings_target, open_settings_repl)

# 6. Update saveSettings
save_settings_target = """  cfg.geminiKey = ($('masterApiKey') && $('masterApiKey').value.trim() !== '') ? $('masterApiKey').value.trim() : $('geminiKey').value.trim();
  cfg.geminiKeys = ($('masterApiPool') && $('masterApiPool').value.trim() !== '') ? $('masterApiPool').value.trim() : ($('geminiKeys') ? $('geminiKeys').value.trim() : '');
  cfg.geminiModel = ($('masterApiModel') && $('masterApiModel').value.trim() !== '') ? $('masterApiModel').value : $('geminiModel').value;
  cfg.groqKey = $('groqKey').value.trim();
  cfg.groqKeys = $('groqKeys') ? $('groqKeys').value.trim() : '';
  cfg.groqModel = $('groqModel').value;"""

save_settings_repl = """  cfg.openaiKey = $('openaiKey') ? $('openaiKey').value.trim() : '';
  cfg.openaiKeys = $('openaiPool') ? $('openaiPool').value.trim() : '';
  cfg.openaiModel = $('openaiModel') ? $('openaiModel').value : '';
  cfg.geminiKey = $('geminiKeyInput') ? $('geminiKeyInput').value.trim() : ($('geminiKey') ? $('geminiKey').value.trim() : '');
  cfg.geminiKeys = $('geminiPoolInput') ? $('geminiPoolInput').value.trim() : ($('geminiKeys') ? $('geminiKeys').value.trim() : '');
  cfg.geminiModel = $('geminiModelInput') ? $('geminiModelInput').value : ($('geminiModel') ? $('geminiModel').value : '');
  cfg.groqKey = $('groqKeyInput') ? $('groqKeyInput').value.trim() : ($('groqKey') ? $('groqKey').value.trim() : '');
  cfg.groqKeys = $('groqPoolInput') ? $('groqPoolInput').value.trim() : ($('groqKeys') ? $('groqKeys').value.trim() : '');
  cfg.groqModel = $('groqModelInput') ? $('groqModelInput').value : ($('groqModel') ? $('groqModel').value : '');"""
content = content.replace(save_settings_target, save_settings_repl)

with open(r"C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\src\app.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated app.js")
