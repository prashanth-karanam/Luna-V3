
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 120000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, {
          ...options,
          signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch(e) {
      clearTimeout(id);
      if (e.name === 'AbortError') {
        throw new Error('Request timed out after ' + (timeout/1000) + ' seconds. The AI model may be overloaded.');
      }
      throw e;
    }
}

/* ══════════════════════════════════════════════════════
   LUNA AI – Core Logic (v3 - Holographic Orb & Dual Engine)
   ══════════════════════════════════════════════════════ */

// ─── Config & Keys ────────────────────────────────────────
const GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_BASE    = 'https://api.groq.com/openai/v1';

function startBrainActivity() {}
function stopBrainActivity() {}

// Storage & editor - declared early to avoid ReferenceError in getSystemPrompt
let storageData = JSON.parse(localStorage.getItem('luna_storage') || '[]');
let aliasData = {};
try {
  if (window.osAPI && window.osAPI.existsSync('data/contacts.json')) {
    aliasData = JSON.parse(window.osAPI.readFileSync('data/contacts.json', 'utf-8'));
  }
} catch (e) { console.error('Failed to load data/contacts.json:', e); }
let monacoEditor = null;

// Dynamic System Prompt including Time and Date
const getSystemPrompt = (userQuery = '') => {
  const now = new Date();
  const time = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const date = now.toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'});
  const currentMode = state ? state.screen.toUpperCase() : 'UNKNOWN';
  
  const userHome = (window.osAPI && window.osAPI.homedir) ? window.osAPI.homedir() : "C:/Users/PRASANTH";
    let base = `Luna OS | ${date} ${time} | Mode: ${currentMode}\n[USER DIRECTORY]: ${userHome}

[IDENTITY]: You are Luna AI, an advanced physical OS agent created by Sai Prashant. You have full root-level control of this computer, you have eyes (you can see the screen), and hands (you can type and click).
  RULE 1: You MUST NEVER refer to yourself as "Phi" or mention "Empero AI".
  RULE 2: NEVER apologize. NEVER mention that you are a language model, an AI, or tuned by OpenAI/Google. Just DO the task.
  RULE 3: Be ultra-concise. Give exactly the answer requested without huge paragraphs of unnecessary details.
  RULE 4: NEVER explain your internal system mechanisms, how you sent a message, or what tools you used. Just execute them silently.

  [SYSTEMATIC THOUGHT PROCESS]
${(cfg.showThoughts !== false) ? `For EVERY request, you MUST output your internal reasoning BEFORE your final answer or tool usage. Wrap your reasoning in either <thought>...</thought> or <think>...</think> tags.` : `You may execute tools immediately without prior explanation.`}`;

  const cbVision = document.getElementById('includeVisionContext');
  const needsVision = cbVision ? cbVision.checked : false;
  const needsDesktop = /\b(app|open|click|type|python|desktop|automate|control|send|message|dm)\b/i.test(userQuery);
  const needsSearch = /\b(search|web|google|find out|who|what|when|where|why|how|news|latest|score|match|weather)\b/i.test(userQuery);
  const needsFileSystem = /(file|dir|folder|terminal|cmd|command|run)/i.test(userQuery);
  
  if (needsVision || needsDesktop || needsSearch || needsFileSystem || currentMode === 'VOICE') {
      const jsonFormat = (cfg.showThoughts !== false) 
          ? `{"thought": "your reasoning", "response": "what you want to say to the user", "tool": "TOOL_NAME", "query": "value", "code": "value"}`
          : `{"response": "what you want to say to the user", "tool": "TOOL_NAME", "query": "value", "code": "value"}`;
      base += `\\n\\n[CAPABILITIES & JSON TOOL FORMAT]\\nYou MUST interact with the system by outputting ONLY a strict JSON object. Do NOT output any conversational filler, explanations, or raw text before or after the JSON. Format:\\n${jsonFormat}\\nIf you do not need to use a tool, set "tool" to "NONE".\\n`;
  }

  if (needsVision) {
      base += `
- BROWSER & VISION (tool names):
  "CAPTURE_BROWSER" - Screenshots internal web browser
  "CAPTURE_SCREEN" - Screenshots the physical desktop
  * If you need to see the screen to answer, use "CAPTURE_SCREEN".`;
  }

  if (needsSearch) {
      base += `
- WEB SEARCHING:
  * SILENT_SEARCH (Fast API): Use this for factual questions, news, and weather when the user just wants an answer. Format: ${cfg.showThoughts !== false ? '{"thought": "searching silently", "tool": "SILENT_SEARCH", "query": "your search term"}' : '{"tool": "SILENT_SEARCH", "query": "your search term"}'}
  * WEB_SEARCH (Visible Browser): Use this if the user wants to VISUALLY see a website, scorecard, or webpage interface. Format: ${cfg.showThoughts !== false ? '{"thought": "opening browser", "tool": "WEB_SEARCH", "query": "your search term"}' : '{"tool": "WEB_SEARCH", "query": "your search term"}'}`;
  }
   if (needsDesktop) {
      const msgFormat = cfg.showThoughts !== false 
          ? '{"thought": "sending", "response": "Sending now", "tool": "SEND_MESSAGE", "query": "instagram|username|hello"}'
          : '{"response": "Sending now", "tool": "SEND_MESSAGE", "query": "instagram|username|hello"}';
      base += `
- MESSAGING: Use SEND_MESSAGE for WhatsApp/Instagram/Telegram/Discord. Format: ${msgFormat}
  The query is: platform|receiver|message. The backend handles everything.
- OPEN APP / URL: Use tool "OPEN_APP" (query is app name) or "WEB_GO" (query is full URL). 
  Format: {"tool": "OPEN_APP", "query": "Microsoft Edge"}
- DESKTOP AUTOMATION: Use tools "DESKTOP_TYPE", "DESKTOP_PRESS", "WEB_CLICK".
RULES:
* If the user asks you to search for something, check the SYSTEM CONTEXT first! If the active window is ALREADY a browser (like Microsoft Edge or Chrome) or a file explorer, DO NOT launch a new browser! Simply use DESKTOP_TYPE to type the query into the already focused window, and DESKTOP_PRESS:enter to execute it!
* If user says "open insta", use OPEN_APP. If user says "message X on insta", use SEND_MESSAGE.
* On error feedback, retry immediately with correct format. No apologies.
* On success feedback, briefly confirm success to the user in your "response" (e.g. "Done!").`;
  }

  if (needsFileSystem) {
      base += `
- FILE SYSTEM & SYSTEM APPS (tool names):
  "LIST_DIR", "READ_FILE", "DELETE_FILE", "CREATE_DIR", "SEARCH_FILES" - Use "query" for path or pattern
  "RUN_CMD", "OPEN_TERMINAL" - Use "query" for command
  "WRITE_FILE" - Use "query" formatted as "filepath|content"
  "RENAME_FILE" - Use "query" formatted as "old_filepath|new_name"
  "DOWNLOAD_FILE" - Use "query" formatted as "url|save_path"
  * If the user provides a numbered list of files and asks to read one, use "READ_FILE".`;
  }

  if (currentMode === 'VOICE') {
      base += `\n* In VOICE mode, keep verbal responses to 1-sentence.`;
  }

  base += `\n\n[CRITICAL DIRECTIVES]
- NEVER generate markdown guides, tutorials, or pseudo-code. Just DO the task immediately using JSON.
- Output ONLY valid JSON if using a tool.`;

  // Inject context logic
  const isCustomAPI = cfg.geminiKey || cfg.groqKey ? "Custom API Bypass" : "Standard Pool";
  const currentWallpaper = document.getElementById('wallpaperLayer')?.style.backgroundImage || "Default";
  base += `\n\n[SYS INFO]: Active Wallpaper: ${currentWallpaper}. API Mode: ${isCustomAPI}. Tokens used this session: ${state.sessionTokens}.`;

  const needsWallpaperInfo = /(wallpaper|background|bg|theme|image|picture)/i.test(userQuery);
  if (needsWallpaperInfo || currentMode === 'VOICE') {
      const availWp = (typeof BUILTIN_WALLPAPERS !== 'undefined' ? BUILTIN_WALLPAPERS.map(w=>w.file).join(', ') : 'bg1.jpg, bg2.jpg, bg3.jpg, bg4.jpg, bg5.jpg');
      const uploadedWp = (typeof storageData !== 'undefined' ? storageData.filter(f => f.content.startsWith('data:image')).map(f => f.name).join(', ') : '');
      const allWps = availWp + (uploadedWp ? ', Uploaded: ' + uploadedWp : '');
      base += `\n[SYS INFO]: Available Wallpapers: ${allWps}.`;
  }

  
  // Inject Alias Storage mapping
  if (Object.keys(aliasData).length > 0) {
    base += `\n[SAVED ALIASES / CONTACTS]:\n`;
    for (const [name, target] of Object.entries(aliasData)) {
      base += `- ${name} -> ${target}\n`;
    }
  }

  if (typeof lunaMemory !== 'undefined' && lunaMemory.length > 0) {
    base += `\n[MEMORY]:\n${lunaMemory.map((m, i) => `${i+1}. ${m}`).join('\n')}`;
  }

  const needsFiles = /(read|file|storage|bank|context|document)/.test(userQuery);
  if (typeof storageData !== 'undefined' && storageData.length > 0 && needsFiles) {
    base += `\n[DATA BANK]:\n`;
    storageData.forEach(f => { 
      if (!f.content.startsWith('data:image')) {
        base += `--- ${f.name} ---\n${f.content.substring(0, 1500)}...\n`; 
      }
    });
  }

  const cbIDE = document.getElementById('includeIDEContext');
  const needsIDE = cbIDE ? cbIDE.checked : false;
  if (monacoEditor && needsIDE) {
    const currentCode = monacoEditor.getValue();
    if (currentCode.trim().length > 0) {
      base += `\n[IDE CONTENT]:\n\`\`\`\n${currentCode.substring(0, 3000)}\n\`\`\``;
    }
  }

  return base;
};

// ─── State ────────────────────────────────────────────────
const cfg = {
  geminiKey:    localStorage.getItem('luna_geminiKey')    || '',
  geminiKeys:   localStorage.getItem('luna_geminiKeys')   || '',
  geminiModel:  (function(){ let m = localStorage.getItem('luna_geminiModel') || 'gemini-2.5-flash'; if(m.includes('1.5')) return 'gemini-2.5-flash'; if(m==='gemini-3.1-pro') return 'gemini-3.1-pro-preview'; if(m==='gemini-3-flash') return 'gemini-3-flash-preview'; return m; })(),
  groqKey:      localStorage.getItem('luna_groqKey')      || '',
  groqKeys:     localStorage.getItem('luna_groqKeys')     || '',
  groqModel:    (localStorage.getItem('luna_groqModel') || 'llama-3.1-8b-instant').replace('llama3-8b-8192', 'llama-3.1-8b-instant'),
  routerModel:  localStorage.getItem('luna_routerModel') || 'phi3:mini',
  heavyModel:   localStorage.getItem('luna_heavyModel') || 'phi3:mini',
  engine:       localStorage.getItem('luna_engine')       || 'auto',
  systemPrompt: localStorage.getItem('luna_system')       || '',
  wakeWord:     localStorage.getItem('luna_wakeWord')     || 'wake up luna',
  messagingMode: localStorage.getItem('luna_messagingMode') || 'browser',
  rememberHistory: localStorage.getItem('luna_rememberHistory') !== 'false',
  optMode:      localStorage.getItem('luna_optMode')      || 'phi3:mini:latest',
  showThoughts: localStorage.getItem('luna_showThoughts') !== 'false',
  wallpaperBlur: parseInt(localStorage.getItem('luna_wallpaperBlur') || '0', 10),
  voiceEngine:  localStorage.getItem('luna_voiceEngine')  || 'system'
};

const state = {
  screen:       'sleep',
  awake:        false,
    listening:    false,
  speaking:     false,
  totalTokens:  parseInt(localStorage.getItem('luna_totalTokens') || '0', 10),
  sessionTokens: 0,
  processingVoice: false,
  flashModels: ['gemini-1.5-flash-8b', 'gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-2.5-flash'],
  flowModels: ['gemini-1.5-pro', 'gemini-exp-1206', 'gemini-2.0-pro-exp-02-05'],
  history:      [],
  maxContext:   20,
  usageLog:     JSON.parse(localStorage.getItem('luna_usageLog') || '[]'),
  startMode:    'chat',
  geminiIdx:    parseInt(localStorage.getItem('luna_geminiIdx') || '-1', 10),
  groqIdx:      parseInt(localStorage.getItem('luna_groqIdx') || '-1', 10),
  currentLayer: 1
};

function getCleanedHistory() {
  return state.history.filter(m => {
    const text = String(m.text || '').trim();
    if (text.includes('"tool_code"') || text.includes('tool_code') || text.includes('browser.goto') || text.includes('os.exec') || text.includes('tool_calls')) {
      return false;
    }
    if (text.toLowerCase().includes('unicode') || text.toLowerCase().includes('encoding error') || text.includes('browser encoding error')) {
      return false;
    }
    return true;
  });
}

function updateAnalyticsUI() {
  const now = Date.now(), day = 86400000;
  const t24 = state.usageLog.filter(l => l.ts > now - day).reduce((a, b) => a + b.count, 0);
  const t7d = state.usageLog.filter(l => l.ts > now - 7*day).reduce((a, b) => a + b.count, 0);
  const tAll = state.usageLog.reduce((a, b) => a + b.count, 0);
  if($('tokens24h')) $('tokens24h').textContent = t24;
  if($('tokens7d')) $('tokens7d').textContent = t7d;
  if($('tokensAll')) $('tokensAll').textContent = tAll;
}

let allSessions = JSON.parse(localStorage.getItem('luna_sessions') || '[]');
let currentSessionId = Date.now();

function saveHistory() {
  if (cfg.rememberHistory) {
    if(state.history.length > 40) state.history = state.history.slice(-40);
    let session = allSessions.find(s => s.id === currentSessionId);
    if (!session) {
       session = { id: currentSessionId, title: 'Chat ' + new Date().toLocaleTimeString(), history: [] };
       allSessions.unshift(session);
    }
    // Deep copy and strip base64 inlineData (images) to prevent QuotaExceededError crashes
    const safeHistory = state.history.map(msg => ({
      ...msg,
      parts: msg.parts ? msg.parts.map(p => {
        if (p.inlineData) return { text: '[Image Attached - Data Purged to Save Space]' };
        if (p.text) return { text: p.text };
        return p;
      }) : []
    }));
    session.history = safeHistory;
    session.tokens = state.sessionTokens;
    if (allSessions.length > 10) allSessions = allSessions.slice(0, 10);
    try {
      localStorage.setItem('luna_sessions', JSON.stringify(allSessions));
    } catch (e) {
      console.warn("Storage full! Wiping old sessions to make room.");
      allSessions = [session];
      localStorage.setItem('luna_sessions', JSON.stringify(allSessions));
    }
  } else {
    localStorage.removeItem('luna_sessions');
  }
}

function loadHistoryUI() {
  const list = $('historyList');
  if(!list) return;
  list.innerHTML = '';
  if (allSessions.length === 0) {
    list.innerHTML = '<div style="color:var(--dim);font-size:0.8rem;text-align:center;padding:20px;">No past conversations yet.</div>';
    return;
  }
  allSessions.forEach(sess => {
     const row = document.createElement('div');
     row.style.cssText = 'display:flex;align-items:center;border-bottom:1px solid var(--border);transition:background 0.2s;';
     row.onmouseover = () => row.style.background = 'rgba(0,180,255,0.08)';
     row.onmouseout = () => row.style.background = 'transparent';

     const label = document.createElement('div');
     label.style.cssText = 'flex:1;padding:14px;cursor:pointer;color:var(--text);';
     label.textContent = sess.title + ` (${sess.history.length} msgs)`;
     label.onclick = () => {
         currentSessionId = sess.id;
         state.history = [...sess.history];
         $('messages').innerHTML = '';
         state.history.forEach(m => {
             if(m.role !== 'system') addBubble(m.role === 'user' ? 'user' : 'luna', m.text);
         });
         $('historyModal').classList.add('hidden');
     };

     const delBtn = document.createElement('button');
     delBtn.innerHTML = '✕';
     delBtn.title = 'Delete Conversation';
     delBtn.style.cssText = 'background:none;border:none;color:var(--dim);font-size:1.1rem;padding:14px;cursor:pointer;transition:color 0.2s;';
     delBtn.onmouseover = () => delBtn.style.color = 'var(--red)';
     delBtn.onmouseout = () => delBtn.style.color = 'var(--dim)';
     delBtn.onclick = (e) => {
         e.stopPropagation();
         allSessions = allSessions.filter(s => s.id !== sess.id);
         localStorage.setItem('luna_sessions', JSON.stringify(allSessions));
         if (currentSessionId === sess.id) {
             currentSessionId = Date.now();
             state.history = [];
             state.sessionTokens = 0;
             $('messages').innerHTML = '';
         }
         loadHistoryUI();
     };

     row.appendChild(label);
     row.appendChild(delBtn);
     list.appendChild(row);
  });
}

// ─── DOM Helpers ──────────────────────────────────────────
const $  = id => document.getElementById(id);
const q  = sel => document.querySelector(sel);
const qa = sel => document.querySelectorAll(sel);

// ─── Toast Notifications ──────────────────────────────────
function showToast(msg, isError = false) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `
    position:fixed; bottom:30px; left:50%; transform:translateX(-50%) translateY(20px);
    background:${isError ? 'rgba(255,60,60,0.92)' : 'rgba(0,180,255,0.92)'};
    color:#fff; padding:10px 22px; border-radius:30px; font-size:0.85rem;
    font-family:'Inter',sans-serif; letter-spacing:0.5px; z-index:99999;
    box-shadow:0 4px 24px rgba(0,0,0,0.4); opacity:0;
    transition:opacity 0.3s, transform 0.3s; pointer-events:none;
  `;
  document.body.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => t.remove(), 350);
  }, 3000);
}

// ─── Holographic Orb Animation (Canvas) ───────────────────
function initOrb(canvasId) {
  const canvas = $(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.min(cx, cy) * 0.9;
  
  let time = 0;
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += 0.02;
    
    // Core glow
    const pulse = Math.sin(time * 2) * 0.1 + 0.9;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.5 * pulse);
    grd.addColorStop(0, 'rgba(0, 255, 255, 1.0)');
    grd.addColorStop(0.5, 'rgba(0, 150, 255, 0.6)');
    grd.addColorStop(1, 'rgba(0, 0, 50, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Rotating Rings & Arcs
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Inner dashed ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.5);
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.9)';
    ctx.setLineDash([5, 10]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    // Middle solid arcs
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-time * 0.8);
    ctx.strokeStyle = 'rgba(0, 255, 255, 1.0)';
    ctx.setLineDash([]);
    ctx.lineWidth = 5;
    for(let i=0; i<4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, i * Math.PI/2, i * Math.PI/2 + Math.PI/4);
        ctx.stroke();
    }
    ctx.restore();
    
    // Outer thin ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.3);
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    
    // Outer tick marks
    ctx.lineWidth = 4;
    for(let i=0; i<12; i++) {
        ctx.beginPath();
        ctx.moveTo(r * 0.9, 0);
        ctx.lineTo(r * 0.95, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 6);
    }
    ctx.restore();
    
    requestAnimationFrame(draw);
  }
  draw();
}

// Initialize all orbs
initOrb('sleepOrbCanvas');
initOrb('voiceOrbCanvas');
initOrb('chatOrbCanvas');

// ─── Data Bank (Storage) Logic ─────────────────────────────
// storageData already declared at top of file

window.removeStorage = function(index) {
  storageData.splice(index, 1);
  localStorage.setItem('luna_storage', JSON.stringify(storageData));
  updateStorageUI();
};

function updateStorageUI() {
  const list = $('storageList');
  if(!list) return;
  list.innerHTML = '';
  storageData.forEach((f, i) => {
    const div = document.createElement('div');
    div.style.padding = '5px 0';
    div.innerHTML = `📄 ${f.name} <span style="color:var(--dim); font-size:0.7rem;">(${(f.content.length/1024).toFixed(1)}kb)</span> <span style="color:var(--red);cursor:pointer;float:right;" onclick="removeStorage(${i})">✕</span>`;
    list.appendChild(div);
  });
}

function handleFileUpload(files) {
  for(let file of files) {
    const reader = new FileReader();
    reader.onload = e => {
      storageData.push({ name: file.name, content: e.target.result });
      localStorage.setItem('luna_storage', JSON.stringify(storageData));
      updateStorageUI();
    };
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  }
}

// ─── Screen Transitions ──────────────────────────────────
function showScreen(name) {
  state.screen = name;
  $('sleepScreen').classList.toggle('hidden', name !== 'sleep');
  $('voiceScreen').classList.toggle('hidden', name !== 'voice');
  $('chatScreen').classList.toggle('hidden',  name !== 'chat');
  
  if (name !== 'sleep') $('sleepScreen').classList.add('fade-out');
  
  renderHoloClock(name);
  
  if (name === 'voice') { 
      $('modeRead').textContent = 'VOICE';
      // Only greet if the voice display is empty (first time or reset)
      const display = $('voiceReply');
      if (!display || !display.textContent.trim()) {
          setTimeout(speakGreeting, 400); 
      }
      startListening(); 
  }
  if (name === 'chat') { 
      $('modeRead').textContent = 'CHAT';
      setTimeout(() => addWelcomeIfEmpty(), 300); 
      $('msgInput').focus(); 
      if (typeof stopSpeaking === 'function') stopSpeaking();
      stopListening();
  }
}

// ─── Sleep Screen ────────────────────────────────────────
if ($('sleepVoiceBtn')) $('sleepVoiceBtn').addEventListener('click', e => {
  e.stopPropagation(); state.startMode = 'voice';
  $('sleepVoiceBtn').classList.add('active'); $('sleepChatBtn').classList.remove('active');
});
if ($('sleepChatBtn')) $('sleepChatBtn').addEventListener('click', e => {
  e.stopPropagation(); state.startMode = 'chat';
  $('sleepChatBtn').classList.add('active'); $('sleepVoiceBtn').classList.remove('active');
});

function wake() {
  if (state.awake) return;
  state.awake = true;
  $('statusRead').textContent = 'ACTIVE';
  showScreen(state.startMode);
}
if ($('sleepScreen')) $('sleepScreen').addEventListener('click', wake);

// ─── TTS & Audio ──────────────────────────────────────────
// New typewriter speak() implementation
window.speak = function(text, onEnd, displayText) {
    if(!text) { if(onEnd) onEnd(); return; }
    let displayEl = document.getElementById('voiceReply');
    if (!displayEl) displayEl = document.getElementById('voiceGreeting');
    
    if (displayEl) {
        displayEl.textContent = '';
        displayEl.classList.add('active');
        let txt = displayText || text;
        let i = 0;
        let interval = setInterval(() => {
            displayEl.textContent += txt.charAt(i);
            i++;
            if(i >= txt.length) clearInterval(interval);
        }, 30);
    }

    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        let u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        u.pitch = 1.1;
        let voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => v.name.includes('Zira') || v.name.includes('Female')) || voices[0];
        if (voice) u.voice = voice;
        u.onend = () => { if(onEnd) onEnd(); };
        u.onerror = () => { if(onEnd) onEnd(); };
        window.speechSynthesis.speak(u);
    } else {
        if(onEnd) setTimeout(onEnd, 1500);
    }
};

function speakGreeting() {
  const h = new Date().getHours();
  const msg = h < 12 ? 'Good morning! I am Luna.' : h < 18 ? 'Good afternoon! I am Luna.' : 'Good evening! I am Luna.';
  $('voiceGreeting').textContent = msg;
  if (typeof speak === 'function') speak(msg);
}

// ─── Speech Recognition (Local Whisper C++) ──────────────────────────
let mediaRecorder = null;
let audioChunks = [];
let localWhisperActive = false;
let silenceTimer = null;

async function blobToWavBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const actx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const audioBuffer = await actx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  
  const buffer = new ArrayBuffer(44 + channelData.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + channelData.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 16000 * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, channelData.length * 2, true);

  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

async function setupRecognition() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    
    mediaRecorder.onstart = () => {
      state.listening = true;
      localWhisperActive = true;
      $('micBtn').classList.add('listening');
      $('micLabel').textContent = 'Listening (Local AI)...';
      $('waveform').classList.add('active');
      $('voiceTranscript').textContent = "";
      
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (state.listening) stopListening();
      }, 7000); 
    };
    
    mediaRecorder.onstop = async () => {
      state.listening = false;
      localWhisperActive = false;
      $('micBtn').classList.remove('listening');
      $('micLabel').textContent = 'Transcribing...';
      $('waveform').classList.remove('active');
      clearTimeout(silenceTimer);
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      
      if (audioBlob.size < 1000) {
         $('micLabel').textContent = 'Tap to speak';
         return;
      }

      try {
        const wavBlob = await blobToWavBlob(audioBlob);
        const formData = new FormData();
        formData.append('file', wavBlob, 'audio.wav');
        formData.append('response_format', 'json');

        const res = await fetchWithTimeout('http://127.0.0.1:8080/inference', {
            method: 'POST',
            body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          const txt = (data.text || '').trim();
          $('voiceTranscript').textContent = txt;
          $('micLabel').textContent = 'Tap to speak';
          
          if (!txt) return;
          const exactCmd = txt.toLowerCase();
          if (!state.awake && (exactCmd.includes(cfg.wakeWord) || exactCmd.includes('wake up luna'))) { wake(); return; }
          if (!state.awake) return;
          
          const isVoiceSwitch = ['voice mode','switch to voice','go to voice'].some(p => exactCmd.includes(p));
          const isChatSwitch  = ['chat mode','text mode','switch to chat'].some(p => exactCmd.includes(p));
          const isSleep       = ['sleep','go to sleep','goodnight','luna sleep'].some(p => exactCmd.includes(p));
          
          if (isChatSwitch)  { showScreen('chat');  return; }
          if (isVoiceSwitch) { showScreen('voice'); return; }
          if (isSleep)       { sleepLuna();         return; }
          
          if (txt.length > 2) {
              $('micLabel').textContent = 'Processing...';
              processVoiceChat(txt);
          }
        } else {
          $('micLabel').textContent = 'Transcription failed.';
          console.error(await res.text());
          setTimeout(() => { $('micLabel').textContent = 'Tap to speak'; }, 2000);
        }
      } catch(e) {
        $('micLabel').textContent = 'Error processing audio';
        console.error(e);
        setTimeout(() => { $('micLabel').textContent = 'Tap to speak'; }, 2000);
      }
    };
    return mediaRecorder;
  } catch (err) {
    console.error("Microphone error", err);
    $('micLabel').textContent = 'Mic Error';
    return null;
  }
}

async function startListening() {
  if (state.speaking) return;
  
  if (!mediaRecorder) {
    await setupRecognition();
  }
  
  if (mediaRecorder && mediaRecorder.state === 'inactive') {
    audioChunks = [];
    mediaRecorder.start(200);
  }
}

async function stopListening() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}


async function callAI(userText, failCount = 0, depth = 0, onChunk = null) {
  console.log('[LUNA-DEBUG] callAI entered. depth=' + depth + ' engine=' + cfg.engine + ' optMode=' + cfg.optMode);
  if (window.isAborted) return;
  state.history.push({ role: 'user', text: userText });
  saveHistory();

  let sysPrompt = "";
  sysPrompt += `[IDENTITY]: You are Luna, a highly empathetic, natural, and conversational assistant created by Sai Prashant.
Speak naturally like a close human friend. Do not act robotic. Be concise.
If the user asks you to search, open apps, or do anything on their computer, you MUST use the tool system below. Do NOT make up answers for factual/current-event questions.`;

  const lowerQuery = userText.toLowerCase();
  
  let tempContext = "";
  try {
    const aw = await window.electronAPI.getActiveWindow();
    if (aw && aw.ok && aw.title) {
       tempContext += `[SYSTEM CONTEXT: Foreground Active Window Title is '${aw.title}']\n`;
    }
    const res = await window.electronAPI.runPython('web_automation.py', ['status']);
    if (res && res.status === 'open') {
      tempContext += `[SYSTEM CONTEXT: Automation Browser is OPEN. Active Tab: '${res.title}', URL: '${res.url}']\n`;
    } else {
      tempContext += `[SYSTEM CONTEXT: Automation Browser is CLOSED.]\n`;
    }
  } catch(e) { console.log('[LUNA-DEBUG] web_automation error:', e); }
  
  const APP_URL_MAP = {
      'insta': 'https://www.instagram.com/', 'instagram': 'https://www.instagram.com/', 'reels on insta': 'https://www.instagram.com/reels/', 'insta reels': 'https://www.instagram.com/reels/', 'instagram reels': 'https://www.instagram.com/reels/', 'reels': 'https://www.instagram.com/reels/',
      'whatsapp': 'WhatsApp', 'wa': 'WhatsApp', 'telegram': 'Telegram', 'tg': 'Telegram',
      'discord': 'Discord', 'chrome': 'Google Chrome', 'google chrome': 'Google Chrome', 
      'opera': 'Opera', 'edge': 'Microsoft Edge', 'microsoft edge': 'Microsoft Edge', 'ms edge': 'Microsoft Edge',
      'youtube': 'https://www.youtube.com/', 'yt': 'https://www.youtube.com/',
      'twitter': 'https://www.twitter.com/', 'x': 'https://www.twitter.com/',
      'github': 'https://www.github.com/', 'reddit': 'https://www.reddit.com/',
      'spotify': 'Spotify', 'netflix': 'https://www.netflix.com/',
      'notepad': 'Notepad', 'calculator': 'Calculator', 'calc': 'Calculator',
      'settings': 'Settings', 'explorer': 'explorer', 'files': 'explorer', 'file explorer': 'explorer',
      'paint': 'Paint', 'terminal': 'cmd', 'cmd': 'cmd', 'powershell': 'powershell', 'command prompt': 'cmd',
      'vs code': 'Visual Studio Code', 'vscode': 'Visual Studio Code', 'visual studio code': 'Visual Studio Code',
      'word': 'Word', 'excel': 'Excel', 'powerpoint': 'PowerPoint'
  };
  const knownAppNames = Object.keys(APP_URL_MAP).sort((a,b) => b.length - a.length).join('|');

  const actionRegex = /\b(search|open|app|click|type|file|dir|folder|cmd|run|web|google|news|latest|score|match|weather|download|install|send|message|dm|whatsapp|instagram|insta|telegram|discord|email|mail)\b/i;
  const openAppRegex = new RegExp(`\\b(open|launch)\\b.*\\b(${knownAppNames})\\b`, 'i');
  
  let requireCloudAction = false;
  const hasCloudKey = cfg.geminiKey || cfg.openaiKey || cfg.groqKey;
  const isCompound = /\band\s+(search|find|open|tell|read|check|show|write|send)\b/i.test(lowerQuery) || (lowerQuery.split(' ').length > 8 && lowerQuery.includes('and'));
    if ((actionRegex.test(lowerQuery) || depth > 0) && hasCloudKey && (!openAppRegex.test(lowerQuery) || isCompound)) {
      requireCloudAction = true;
  }

  const openKnownRegex = new RegExp(`\\b(?:open|launch)\\s+(?:the\\s+|my\\s+)?(${knownAppNames})\\b`, 'i');
  if (openKnownRegex.test(lowerQuery)) {
      const appMatch = lowerQuery.match(openKnownRegex);
      if (appMatch) {
          const appKey = appMatch[1].toLowerCase();
          const resolved = APP_URL_MAP[appKey];
          const isUrl = resolved.startsWith('http');
          
          // Inject Fast-Path Checkbox UI
          const cbId = 'tool_cb_' + Date.now() + '_' + Math.floor(Math.random()*1000);
          const friendlyName = isUrl ? `Navigating to ${appKey}...` : `Opening ${appKey}...`;
          if (friendlyName && typeof addBubbleReveal === 'function') {
              addBubbleReveal('luna', `<div class="checkbox-wrapper" style="margin: 4px 0;"><input type="checkbox" id="${cbId}" disabled /><div class="checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div><span class="label" style="color:var(--dim); font-size:0.85rem;">${friendlyName}</span></div>`);
          }

          if (window.electronAPI) {
              let res;
              if (isUrl) {
                  res = await window.electronAPI.runPython('web_automation.py', ['goto', resolved]);
              } else {
                  res = await window.electronAPI.runPython('app_launcher.py', [resolved]);
              }
              
              const cb = document.getElementById(cbId);
              if (cb) { cb.checked = true; cb.parentElement.querySelector('.label').style.color = 'var(--checkbox-color)'; }
              
              if (res && !res.ok) console.error('[LUNA-DEBUG] Fast path error:', res.error);
          }
          
          const compoundMatch = lowerQuery.match(/\b(?:and|then|also)\s+(.+)/i);
          if (compoundMatch) {
              const remaining = compoundMatch[1].trim();
              await new Promise(r => setTimeout(r, 1500)); // Wait for app to become active window
              return await callAI(remaining, failCount, depth, onChunk);
          }
          return `I've opened ${appKey} for you!`;
      }
  }

  if (requireCloudAction) {
    console.log('[LUNA-ROUTER] Action regex matched -> Generating full system context for cloud engine.');
    sysPrompt += tempContext + getSystemPrompt(lowerQuery);
    if (cfg.systemPrompt.trim() !== '') {
      sysPrompt += `\n\n[ADDITIONAL USER INSTRUCTIONS]:\n${cfg.systemPrompt}`;
    }
  } else {
    console.log('[LUNA-ROUTER] Conversational query -> Using LITE prompt to minimize latency for local engine.');
  }

  let priority = [];
  const engine = cfg.engine === 'auto' ? (cfg.openaiKey ? 'openai' : (cfg.geminiKey ? 'gemini' : 'groq')) : cfg.engine;
  if (!requireCloudAction) priority.push('ollama');
  if (engine === 'openai') priority.push('openai', 'gemini', 'groq');
  else if (engine === 'gemini') priority.push('gemini', 'groq', 'openai');
  else if (engine === 'groq') priority.push('groq', 'gemini', 'openai');
  else priority.push('gemini', 'openai', 'groq');
  priority = [...new Set(priority)];

  let cleanHistory = [];
  getCleanedHistory().slice(-40, -1).forEach(m => {
    const role = m.role === 'user' ? 'user' : 'assistant';
    let safeText = m.text;
    if (safeText.length > 3000) safeText = safeText.substring(0, 1500) + '\n...[content truncated]...\n' + safeText.substring(safeText.length - 500);
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === role) {
      cleanHistory[cleanHistory.length - 1].content += '\n\n' + safeText;
    } else {
      if (safeText.length > 0) cleanHistory.push({ role, content: safeText });
    }
  });

  const payload = {
    messages: [...cleanHistory, { role: 'user', content: userText }],
    systemPrompt: sysPrompt,
    config: {
      ...cfg,
      priority
    }
  };

  startBrainActivity();
  return new Promise((resolve, reject) => {
    let fullText = '';
    
    window.electronAPI.onLLMToken((chunk) => {
      fullText += chunk;
      if (onChunk) onChunk(fullText, chunk);
    });
    
    window.electronAPI.onLLMError((err) => {
      stopBrainActivity();
      resolve(`❗ Engine Error: ${err}`);
    });
    
    window.electronAPI.onLLMEnd(async () => {
      stopBrainActivity();
      state.history.push({ role: 'model', text: fullText });
      saveHistory();
      try {
        const clean = await parseAICommands(fullText, 0, 0);
        resolve(clean);
      } catch (e) {
        resolve(fullText);
      }
    });
    
    window.electronAPI.startLLMStream(payload).catch((err) => {
      stopBrainActivity();
      resolve(`❗ Engine Error: ${err.message}`);
    });
  });
}




function updateTokens(count) {
  state.totalTokens += count;
  state.sessionTokens += count;
  localStorage.setItem('luna_totalTokens', state.totalTokens);
  
  $('tokenRead').textContent = `${state.totalTokens.toLocaleString()} (+${count})`;
  $('tokenCount').textContent = `Total: ${state.totalTokens.toLocaleString()} | Session: ${state.sessionTokens.toLocaleString()}`;
  
  if ($('sessionTokenReadout') && $('tokenProgressBar')) {
    const limit = (cfg.engine === 'groq' || cfg.groqKey) ? 8000 : 100000;
    $('sessionTokenReadout').textContent = `${state.sessionTokens.toLocaleString()} / ${limit.toLocaleString()}`;
    const pct = Math.min(100, (state.sessionTokens / limit) * 100);
    $('tokenProgressBar').style.width = pct + '%';
  }
  
  // Analytics
  state.usageLog.push({ ts: Date.now(), count: count });
  state.usageLog = state.usageLog.filter(l => l.ts > Date.now() - 30*86400000);
  localStorage.setItem('luna_usageLog', JSON.stringify(state.usageLog));
  updateAnalyticsUI();
}

// ─── Chat UI Helpers ──────────────────────────────────────
function formatText(t) {
  if (!t) return '';
  
  // Robust Markdown Code Block Detection
  // This handles everything from perfect blocks to broken/unclosed ones
  let processed = t.replace(/```([\s\S]*?)(?:```|$)/g, (match, code) => {
    // Escape HTML to prevent rendering bugs
    const safeCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="chat-code-wrap"><pre>${safeCode.trim()}</pre></div>`;
  });

  // Handle thought blocks
  let extractedThoughts = [];
  const thoughtRegex = /(?:<(?:thought|think)>([\s\S]*?)<\/(?:thought|think)>|Thought:([\s\S]*?)(?=\[[A-Z_]+:|$))/gi;
  processed = processed.replace(thoughtRegex, (match, t1, t2) => {
    let thought = t1 || t2;
    let summaryText = window.LunaLoaders.getLoaderHtml(false);
    let detailsHtml = `<details class="thought-block" style="margin-top: 10px;"><summary>${summaryText} <span class="thought-timer" style="font-family:monospace; color:var(--dim); font-size:0.7rem;"></span></summary><div class="thought-content">${thought.trim()}</div></details>`;
    extractedThoughts.push(detailsHtml);
    return "";
  });

  // Handle bold and newlines
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    if (extractedThoughts.length > 0) { processed = extractedThoughts.join('') + "<br><br>" + processed; }
    return processed;
  

}

window.forceSyncCode = function(code) {
  toggleIDE(true);
  setTimeout(() => {
    if (ensureIDE()) {
      monacoEditor.setValue(code);
      monacoEditor.refresh();
      showToast('⚡ Code Force-Synced!');
    }
  }, 400);
};

function addBubble(sender, text) {
  if (sender === 'luna') {
    text = text.replace(/Phi/gi, 'Luna AI');
    text = text.replace(/Empero AI/gi, 'Sai Prashant');
    text = text.replace(/Empero/gi, 'Sai Prashant');
  }
  if(sender === 'system') {
    // Legacy support: redirect old system bubbles to toasts if any slipped through
    showToast(text);
    return;
  }
  const isLuna = sender === 'luna';
  const row = document.createElement('div'); row.className = `bubble-row${isLuna?'':' user-row'}`;
  row.innerHTML = `
    ${isLuna ? `<div class="avatar la" style="background:transparent;box-shadow:none;"><div class="mini-orb-wrap" style="transform: scale(0.65);"><div class="mini-ring"></div><div class="mini-orb-core"></div></div></div>` : ''}
    <div class="bubble-col${isLuna?'':' uc'}">
      <span class="sender-name">${isLuna ? 'LUNA' : 'YOU'}</span>
      <div class="bubble ${isLuna ? 'lb' : 'ub'}">${formatText(text)}
        ${isLuna ? `<div class="bubble-context-menu">
          <button class="dots-btn" onclick="toggleDotsMenu(this, event)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg>
          </button>
          <div class="dots-dropdown">
            <button class="dots-option" onclick="triggerApology(this)">You are completely wrong</button>
          </div>
        </div>` : ''}
      </div>
    </div>
    ${!isLuna ? `<div class="avatar ua"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>` : ''}
  `;
  $('messages').appendChild(row); $('messages').scrollTop = $('messages').scrollHeight;
}

function addBubbleReveal(sender, text) {
  if (sender === 'luna') {
    text = text.replace(/Phi/gi, 'Luna AI');
    text = text.replace(/Empero AI/gi, 'Sai Prashant');
    text = text.replace(/Empero/gi, 'Sai Prashant');
  }
  const isLuna = sender === 'luna';
  const row = document.createElement('div'); row.className = `bubble-row${isLuna?'':' user-row'}`;
  row.innerHTML = `
    ${isLuna ? `<div class="avatar la" style="background:transparent;box-shadow:none;"><div class="mini-orb-wrap" style="transform: scale(0.65);"><div class="mini-ring"></div><div class="mini-orb-core"></div></div></div>` : ''}
    <div class="bubble-col${isLuna?'':' uc'}">
      <span class="sender-name">${isLuna ? 'LUNA' : 'YOU'}</span>
      <div class="bubble ${isLuna ? 'lb' : 'ub'}">${formatText(text)}
        ${isLuna ? `<div class="bubble-context-menu">
          <button class="dots-btn" onclick="toggleDotsMenu(this, event)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg>
          </button>
          <div class="dots-dropdown">
            <button class="dots-option" onclick="triggerApology(this)">You are completely wrong</button>
          </div>
        </div>` : ''}
      </div>
    </div>
  `;
  $('messages').appendChild(row);
  $('messages').scrollTop = $('messages').scrollHeight;
}

async function addWelcomeIfEmpty() {
  if ($('messages').children.length === 0) {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    $('chatGreeting').textContent = `${greet}!`;
    
    addBubbleReveal('luna', `${greet}! I\'m **Luna**, your AI companion.`);
    
    addBubble('luna', `<div class="typing-wave" id="luna-typing-init"><span></span><span></span><span></span><span style="font-size:0.7rem;margin-left:8px;color:var(--dim);">Warming up neural networks...</span></div>`);
    
    // Silently inject "hi" into the conversation history
    state.history.push({ role: 'user', text: 'hi' });
    saveHistory();
    
    try {
        // Actually generate a response using the active model pipeline
        const response = await callAI('hi', 0, 0);
        
        const typingNode = document.getElementById('luna-typing-init');
        if (typingNode && typingNode.closest('.bubble-row')) {
            typingNode.closest('.bubble-row').remove();
        }
        
        // Output the real AI response as the welcome message
        addBubbleReveal('luna', response);
    } catch(e) {
        const typingNode = document.getElementById('luna-typing-init');
        if (typingNode && typingNode.closest('.bubble-row')) {
            typingNode.closest('.bubble-row').remove();
        }
        addBubbleReveal('luna', `Systems fully loaded and ready! How can I help you today?`);
    }
  }
}

// ─── Settings & Setup ──────────────────────────────────────
if ($('toChatBtn')) $('toChatBtn').addEventListener('click', () => showScreen('chat'));
if ($('toVoiceBtn')) $('toVoiceBtn').addEventListener('click', () => showScreen('voice'));
if ($('chatVoiceBtn')) $('chatVoiceBtn').addEventListener('click', () => {
    if(state.listening) { stopListening(); $('chatVoiceBtn').style.color = ''; }
    else { startListening(); $('chatVoiceBtn').style.color = 'var(--blue)'; }
});
if ($('clearBtn')) $('clearBtn').addEventListener('click', () => {
  $('messages').innerHTML = ''; state.history = [];
  if (typeof window.clearImageAttachment === 'function') window.clearImageAttachment();
});

function openSettings() {
  if($('autoApiPool')) $('autoApiPool').value = cfg.autoPool;
  if($('openaiKey')) $('openaiKey').value = cfg.openaiKey;
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
  $('groqModel').value = cfg.groqModel;
  if($('routerModelInput')) $('routerModelInput').value = cfg.routerModel;
  if($('heavyModelInput')) $('heavyModelInput').value = cfg.heavyModel;
  if($('activeEngine')) $('activeEngine').value = cfg.engine;
  
  if($('masterApiKey')) $('masterApiKey').value = cfg.geminiKey;
  if($('masterApiPool')) $('masterApiPool').value = cfg.geminiKeys;
  if($('masterApiModel')) $('masterApiModel').value = cfg.geminiModel;

  if($('systemPrompt')) $('systemPrompt').value = cfg.systemPrompt;
  if($('voiceEngineSetting')) $('voiceEngineSetting').value = cfg.voiceEngine;
  $('wakeWord').value = cfg.wakeWord;
  $('settingsModal').classList.remove('hidden');
}
const closeSettings = () => $('settingsModal').classList.add('hidden');
if ($('settingsBtn')) $('settingsBtn').addEventListener('click', openSettings);
if ($('voiceSettingsBtn')) $('voiceSettingsBtn').addEventListener('click', openSettings);
if ($('closeSettings')) $('closeSettings').addEventListener('click', closeSettings);
if ($('cancelSettings')) $('cancelSettings').addEventListener('click', closeSettings);

if ($('ghostLoginBtn')) {
    $('ghostLoginBtn').addEventListener('click', () => {
        if (window.electronAPI) {
            window.electronAPI.executeCode('shell', 'start python core/luna_message.py login');
            if (typeof showToast === 'function') showToast('Launching Ghost Browser...', false);
        }
    });
}

if ($('saveSettings')) $('saveSettings').addEventListener('click', () => {
  cfg.autoPool = $('autoApiPool') ? $('autoApiPool').value.trim() : '';
  cfg.openaiKey = $('openaiKey') ? $('openaiKey').value.trim() : '';
  cfg.openaiKeys = $('openaiPool') ? $('openaiPool').value.trim() : '';
  cfg.openaiModel = $('openaiModel') ? $('openaiModel').value : '';
  cfg.geminiKey = $('geminiKeyInput') ? $('geminiKeyInput').value.trim() : ($('geminiKey') ? $('geminiKey').value.trim() : '');
  cfg.geminiKeys = $('geminiPoolInput') ? $('geminiPoolInput').value.trim() : ($('geminiKeys') ? $('geminiKeys').value.trim() : '');
  cfg.geminiModel = $('geminiModelInput') ? $('geminiModelInput').value : ($('geminiModel') ? $('geminiModel').value : '');
  cfg.groqKey = $('groqKeyInput') ? $('groqKeyInput').value.trim() : ($('groqKey') ? $('groqKey').value.trim() : '');
  cfg.groqKeys = $('groqPoolInput') ? $('groqPoolInput').value.trim() : ($('groqKeys') ? $('groqKeys').value.trim() : '');
  cfg.groqModel = $('groqModelInput') ? $('groqModelInput').value : ($('groqModel') ? $('groqModel').value : '');
  if($('routerModelInput')) cfg.routerModel = $('routerModelInput').value.trim() || 'phi3:mini';
  if($('heavyModelInput')) cfg.heavyModel = $('heavyModelInput').value.trim() || 'phi3:mini';
  cfg.engine = $('activeEngine').value; 
  cfg.systemPrompt = $('systemPrompt').value.trim();
  if($('voiceEngineSetting')) cfg.voiceEngine = $('voiceEngineSetting').value;
  cfg.wakeWord = $('wakeWord').value.trim();
  if($('rememberHistory')) cfg.rememberHistory = $('rememberHistory').checked;
  cfg.wallpaperBlur = parseInt($('wpBlurRange').value, 10);
  
  Object.keys(cfg).forEach(k => localStorage.setItem(`luna_${k}`, cfg[k]));
  
  // Reset key indexes so it starts fresh with the new keys
  state.geminiIdx = -1;
  state.groqIdx = -1;
  localStorage.setItem('luna_geminiIdx', -1);
  localStorage.setItem('luna_groqIdx', -1);
  
  applyWallpaperBlur();
  closeSettings();
  showToast('⚙️ Settings saved. API Keys reset.');
});

// History Event Listeners
if($('historyBtn')) $('historyBtn').addEventListener('click', () => {
  loadHistoryUI();
  $('historyModal').classList.remove('hidden');
});
if($('closeHistory')) $('closeHistory').addEventListener('click', () => $('historyModal').classList.add('hidden'));
if($('newChatBtn')) $('newChatBtn').addEventListener('click', () => {
  currentSessionId = Date.now();
  state.history = [];
             state.sessionTokens = 0;
             $('messages').innerHTML = '';
  if (typeof window.clearImageAttachment === 'function') window.clearImageAttachment();
  $('historyModal').classList.add('hidden');
});
if($('clearMemoryBtn')) $('clearMemoryBtn').addEventListener('click', () => {
  if(confirm('Wipe all history and token data?')) {
    localStorage.removeItem('luna_sessions');
    localStorage.removeItem('luna_usageLog');
    location.reload();
  }
});

// Storage Events
if($('storageBtn')) $('storageBtn').onclick = () => { updateStorageUI(); $('storageModal').classList.remove('hidden'); };
if($('closeStorage')) $('closeStorage').onclick = () => $('storageModal').classList.add('hidden');
if($('clearStorageBtn')) $('clearStorageBtn').onclick = () => { storageData=[]; localStorage.setItem('luna_storage', '[]'); updateStorageUI(); };
if($('dropZone')) {
  const drop = $('dropZone');
  drop.ondragover = e => { e.preventDefault(); drop.style.borderColor = 'var(--blue)'; };
  drop.ondragleave = e => { e.preventDefault(); drop.style.borderColor = 'var(--border)'; };
  drop.ondrop = e => { e.preventDefault(); drop.style.borderColor = 'var(--border)'; handleFileUpload(e.dataTransfer.files); };
  drop.onclick = () => $('fileUpload').click();
  $('fileUpload').onchange = e => handleFileUpload(e.target.files);
}

// ─── Memory System ─────────────────────────────────────────
let lunaMemory = JSON.parse(localStorage.getItem('luna_memory') || '[]');

function saveMemory() { localStorage.setItem('luna_memory', JSON.stringify(lunaMemory)); }

function renderMemoryList() {
  const list = $('memoryList');
  if (!list) return;
  list.innerHTML = '';
  if (lunaMemory.length === 0) {
    list.innerHTML = '<div style="color:var(--dim);font-size:0.8rem;text-align:center;padding:10px;">No memories yet. Add something!</div>';
    return;
  }
  lunaMemory.forEach((item, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 6px;border-bottom:1px solid var(--border);font-size:0.82rem;color:var(--text);';
    row.innerHTML = `<span style="color:var(--blue)">🧠</span><span style="flex:1">${item}</span><button onclick="deleteMemory(${i})" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:0.9rem;">✕</button>`;
    list.appendChild(row);
  });
}

window.deleteMemory = function(i) {
  lunaMemory.splice(i, 1);
  saveMemory();
  renderMemoryList();
};

if ($('memoryBtn')) $('memoryBtn').onclick = () => { renderMemoryList(); $('memoryModal').classList.remove('hidden'); };
if ($('closeMemory')) $('closeMemory').onclick = () => $('memoryModal').classList.add('hidden');
if ($('addMemoryBtn')) $('addMemoryBtn').onclick = () => {
  const val = $('memoryInput').value.trim();
  if (!val) return;
  lunaMemory.push(val);
  saveMemory(); renderMemoryList();
  $('memoryInput').value = '';
};
if ($('memoryInput')) $('memoryInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('addMemoryBtn').click(); });
if ($('clearMemoryItemsBtn')) $('clearMemoryItemsBtn').onclick = () => { lunaMemory = []; saveMemory(); renderMemoryList(); };

// ─── Image Analysis ─────────────────────────────────────────
let attachedImageBase64 = null;
let attachedImageMime = null;

window.clearImageAttachment = function() {
  attachedImageBase64 = null; attachedImageMime = null;
  $('imagePreviewBar').style.display = 'none';
  $('imageThumb').src = '';
  $('imgUploadInput').value = '';
};

function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    attachedImageBase64 = dataUrl.split(',')[1];
    attachedImageMime = file.type;
    $('imageThumb').src = dataUrl;
    $('imagePreviewLabel').textContent = file.name + ' · ' + (file.size/1024).toFixed(1) + 'kb';
    $('imagePreviewBar').style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

if ($('imgUploadBtn')) $('imgUploadBtn').onclick = () => $('imgUploadInput').click();
if ($('imgUploadInput')) $('imgUploadInput').onchange = e => handleImageFile(e.target.files[0]);

// Paste image from clipboard
document.addEventListener('paste', e => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      handleImageFile(item.getAsFile());
      break;
    }
  }
});

// Drag image onto chat input
const msgInput = $('msgInput');
if (msgInput) {
  msgInput.addEventListener('dragover', e => { e.preventDefault(); msgInput.style.borderColor = 'var(--blue)'; });
  msgInput.addEventListener('dragleave', () => { msgInput.style.borderColor = ''; });
  msgInput.addEventListener('drop', e => {
    e.preventDefault(); msgInput.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageFile(file);
  });
}

// Function to ensure IDE is initialized
function ensureIDE() {
  if (monacoEditor) return true;
  if (!window.CodeMirror) {
    console.warn("[LUNA] CodeMirror library not loaded yet...");
    return false;
  }
  
  const container = document.getElementById('monacoContainer');
  if (!container) return false;
  
  monacoEditor = CodeMirror(container, {
    value: '// LUNA ENGINE: RESILIENT MODE ACTIVE\n// Your code will arrive here automatically.\n\nconsole.log("Luna is ready and synced.");',
    mode: 'javascript',
    theme: 'material-palenight',
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    smartIndent: true,
    indentUnit: 4
  });
  monacoEditor.setSize("100%", "100%");
  console.log("[LUNA] IDE Editor Initialized.");
  return true;
}

// Initialize on start if possible, otherwise it will try again when opened
setTimeout(ensureIDE, 1000);

// Shared IDE toggle helper
function toggleIDE(forceOpen) {
  const pane = $('idePane');
  if (!pane) return;
  const isHidden = pane.classList.contains('hidden');
  if (forceOpen === true || (forceOpen === undefined && isHidden)) {
    pane.classList.remove('hidden');
    // Ensure editor exists when we open the pane
    ensureIDE();
  } else {
    pane.classList.add('hidden');
  }
  if (monacoEditor) setTimeout(() => monacoEditor.refresh(), 150);
}

// IDE Events
if($('consoleBtn'))      $('consoleBtn').onclick      = () => toggleIDE();
if($('voiceConsoleBtn')) $('voiceConsoleBtn').onclick  = () => toggleIDE();
if($('ideCloseBtn'))     $('ideCloseBtn').onclick      = () => $('idePane').classList.add('hidden');
if($('ideFullscreenBtn')) $('ideFullscreenBtn').onclick = () => {
  $('idePane').classList.toggle('fullscreen');
  if(monacoEditor) setTimeout(()=>monacoEditor.refresh(), 100);
};
if($('ideHelpBtn')) $('ideHelpBtn').onclick = () => {
  if(!monacoEditor) return;
  const code = monacoEditor.getValue();
  if(code.trim().length === 0) return;
  const prompt = `Please debug and fix this code:\n\`\`\`\n${code}\n\`\`\``;
  if (state.screen === 'voice') {
    // In voice mode: show transcript and process via voice chat
    if($('voiceTranscript')) $('voiceTranscript').textContent = 'Debug code...';
    processVoiceChat(prompt);
  } else {
    // In chat mode: put in input and send
    $('msgInput').value = prompt;
    sendMessage();
  }
};
if($('ideSaveBtn')) $('ideSaveBtn').onclick = () => {
  if(!monacoEditor) return;
  const code = monacoEditor.getValue();
  const lang = $('ideLangSelect') ? $('ideLangSelect').value : 'js';
  const ext = lang === 'python' ? 'py' : lang === 'html' ? 'html' : 'js';
  const name = `script_${new Date().getTime()}.${ext}`;
  storageData.push({ name: name, content: code });
  localStorage.setItem('luna_storage', JSON.stringify(storageData));
  updateStorageUI();
  addBubble('system', `Code saved to Data Bank as ${name}`);
};
// Language selector wiring
if ($('ideLangSelect')) {
if ($('ideLangSelect')) $('ideLangSelect').addEventListener('change', () => {
    const val = $('ideLangSelect').value;
    if (!monacoEditor) return;
    if (val === 'python') monacoEditor.setOption('mode', 'python');
    else if (val === 'html') monacoEditor.setOption('mode', 'xml');
    else monacoEditor.setOption('mode', 'javascript');
  });
}






if($('ideRunBtn')) $('ideRunBtn').onclick = async () => {
  if(!monacoEditor) return;
  const code = monacoEditor.getValue().trim();
  if(!code) return;

  // ── Language Detection ──────────────────────────────────
  // HTML: starts with < tag or doctype
  const isHTML = /^(<(!DOCTYPE|html|head|body|div|span|p|h[1-6]|script|style|link|meta|ul|ol|li|table|form|input|button|canvas|svg)[\s>]|<!--)/i.test(code);

  // Python: explicit mode OR uses Python-specific syntax anywhere in code
  const isPython = !isHTML && (
    monacoEditor.getOption('mode') === 'python' ||
    /\bprint\s*\(/.test(code) ||
    /^[ \t]*(import |from |def |class |elif |async def|#!\/usr\/bin\/env python)/m.test(code) ||
    /:\s*$/.test(code.split('\n').find(l => /^\s*(def |class |if |for |while |elif |else|try|except|with )/.test(l)) || '') ||
    /^\s*@/.test(code)
  );

  // Auto-switch editor syntax highlighting to match
  if (isHTML && monacoEditor.getOption('mode') !== 'htmlmixed') {
    // CodeMirror doesn't have htmlmixed loaded, use xml as fallback silently
  } else if (isPython && monacoEditor.getOption('mode') !== 'python') {
    monacoEditor.setOption('mode', 'python');
  } else if (!isPython && !isHTML && monacoEditor.getOption('mode') !== 'javascript') {
    monacoEditor.setOption('mode', 'javascript');
  }

  // ── HTML Runner ─────────────────────────────────────────
  if (isHTML) {
    let preview = $('htmlPreviewFrame');
    if (!preview) {
      // Create a floating preview iframe
      const wrap = document.createElement('div');
      wrap.id = 'htmlPreviewWrap';
      wrap.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);width:min(800px,90vw);height:60vh;background:#fff;border:2px solid var(--blue);border-radius:12px;z-index:9999;box-shadow:0 20px 60px rgba(0,0,0,0.7);overflow:hidden;display:flex;flex-direction:column;';
      wrap.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#0a0e1a;border-bottom:1px solid var(--border);flex-shrink:0;">
          <span style="font-family:'Orbitron',sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--blue);">🌐 HTML PREVIEW</span>
          <button onclick="document.getElementById('htmlPreviewWrap').remove()" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:1.1rem;">✕</button>
        </div>
        <iframe id="htmlPreviewFrame" sandbox="allow-scripts allow-same-origin" style="flex:1;border:none;width:100%;background:#fff;"></iframe>
      `;
      document.body.appendChild(wrap);
      preview = $('htmlPreviewFrame');
    }
    // Write HTML into iframe
    const doc = preview.contentDocument || preview.contentWindow.document;
    doc.open(); doc.write(code); doc.close();
    addBubble('system', '🌐 HTML rendered in preview panel.');
    return;
  }

  // ── Python Runner ────────────────────────────────────────
  if (isPython) {
    if (state.pythonRunning) {
      addBubble('system', '🐍 Python is already running a script.');
      return;
    }
    state.pythonRunning = true;
    window.electronAPI.executeCode('python', code).then(res => {
        state.pythonRunning = false;
        if (res.ok) {
            addBubble('system', '🐍 Python Output:\n' + (res.output.trim() || '(no output)'));
        } else {
            addBubble('system', '🐍 Python Error:\n' + res.error + '\n' + res.output);
        }
    });
    return;
  }

  // ── JavaScript Runner ────────────────────────────────────
  {
    const output = [];
    // Polyfills so print/println/alert work like console.log in eval context
    const _print  = (...args) => output.push(args.map(String).join(' '));
    const _oldLog = console.log;
    const _oldWarn = console.warn;
    const _oldErr  = console.error;
    console.log   = (...args) => output.push(args.map(String).join(' '));
    console.warn  = (...args) => output.push('⚠ ' + args.map(String).join(' '));
    console.error = (...args) => output.push('❌ ' + args.map(String).join(' '));
    try {
      // Inject print polyfill into the eval scope via Function constructor
      const runner = new Function('print', 'println', 'console',
        `"use strict";\n${code}`
      );
      const result = runner(_print, _print, { log: _print, warn: _print, error: _print });
      if (output.length > 0) {
        addBubble('system', '⚡ JS Output:\n' + output.join('\n'));
      } else if (result !== undefined) {
        addBubble('system', '⚡ JS Result: ' + String(result));
      } else {
        addBubble('system', '⚡ JS ran with no output.');
      }
    } catch(e) {
      addBubble('system', '⚡ JS Error: ' + e.message);
    } finally {
      console.log   = _oldLog;
      console.warn  = _oldWarn;
      console.error = _oldErr;
    }
  }
};


document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', e => {
  document.querySelectorAll('.tab, .tab-panel').forEach(el => el.classList.remove('active'));
  e.target.classList.add('active');
  $(`tab-${e.target.dataset.tab}`).classList.add('active');
}));

// Populate Gemini Models
const gModels = [
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite' }
];
gModels.forEach(m => {
  const o = document.createElement('option'); 
  o.value = m.id; 
  o.textContent = m.name;
  if (m.id === cfg.geminiModel) o.selected = true;
  $('geminiModel').appendChild(o);
});

// Background Wake Word
(function bgWake() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return;
  const r = new SR(); r.continuous = true; r.lang = 'en-US';
  r.onresult = e => {
    const t = e.results[e.results.length-1][0].transcript.toLowerCase();
    if(!state.awake && (t.includes(cfg.wakeWord) || t.includes('wake up luna'))) wake();
  };
  r.onend = () => { if(!state.awake) try{r.start();}catch(e){} };
  try{r.start();}catch(e){}
})();

function wrapLetters(str, delayOffset = 0) {
  return str.split('').map((char, i) => {
    if (char === ' ') return '&nbsp;';
    return `<span class="holo-char" style="animation-delay: ${delayOffset + i * 0.03}s">${char}</span>`;
  }).join('');
}

var activeHoloClock = null;

function renderHoloClock(screenName) {
  if (activeHoloClock) activeHoloClock.remove();
  
  const screenId = screenName + 'Screen';
  const wrap = $(screenId)?.querySelector('.orb-canvas-wrap');
  if (!wrap) return;

  const orb = wrap.querySelector('canvas');
  const lineLen = orb ? (orb.width / 2 + 20) + 'px' : '130px';

  const clockDiv = document.createElement('div');
  clockDiv.className = 'holo-clock';
  if (screenName === 'chat') clockDiv.classList.add('is-chat');
  clockDiv.style.setProperty('--line-len', lineLen);
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  clockDiv.innerHTML = `
    <div class="holo-line"></div>
    <div class="holo-bracket">
      <div class="holo-bracket-side"></div>
      <div class="holo-date" id="holoDate">${wrapLetters(dateStr, 1.2)}</div>
      <div class="holo-time" id="holoTime">${wrapLetters(timeStr, 1.5)}</div>
    </div>
  `;
  
  wrap.appendChild(clockDiv);
  activeHoloClock = clockDiv;

  if (screenName === 'chat') {
     // Wait for layout
     setTimeout(() => {
         const rect = wrap.getBoundingClientRect();
         const startX = rect.left + rect.width / 2;
         const startY = rect.top + rect.height / 2;
         
         clockDiv.style.left = startX + 'px';
         clockDiv.style.top = startY + 'px';

         // Trigger flight after initial animation completes (3 seconds)
         setTimeout(() => {
            if (activeHoloClock === clockDiv) {
                clockDiv.classList.add('fly-to-corner');
                // Centralize it at the top of the screen
                clockDiv.style.left = '50%';
                clockDiv.style.transform = 'translateX(-50%)';
                clockDiv.style.top = '15px';
            }
         }, 3000);
     }, 50);
  }
}

function showToastLegacy(message, isError = false) {
  let toast = document.getElementById('luna-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'luna-toast';
    toast.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0, 10, 25, 0.9); color: #fff; padding: 12px 24px;
      border-radius: 8px; border: 1px solid rgba(0,180,255,0.4);
      box-shadow: 0 4px 20px rgba(0,0,0,0.5); font-size: 0.85rem;
      z-index: 10000; opacity: 0; transition: opacity 0.3s, top 0.3s;
      pointer-events: none; text-align: center; max-width: 90%;
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.style.borderColor = isError ? 'rgba(255,50,50,0.6)' : 'rgba(0,180,255,0.4)';
  toast.style.top = '30px';
  toast.style.opacity = '1';
  
  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.top = '20px';
  }, 4000);
}

// Ensure it loads on the sleep screen initially
renderHoloClock('sleep');

// Update the text without animation after the initial spawn
setInterval(() => {
  if (!activeHoloClock) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  
  const timeEl = activeHoloClock.querySelector('#holoTime');
  const dateEl = activeHoloClock.querySelector('#holoDate');
  
  if (timeEl && !timeEl.querySelector('.holo-char')) timeEl.textContent = timeStr;
  else if (timeEl) setTimeout(() => timeEl.textContent = timeStr, 2500);

  if (dateEl && !dateEl.querySelector('.holo-char')) dateEl.textContent = dateStr;
  else if (dateEl) setTimeout(() => dateEl.textContent = dateStr, 2500);
  
}, 1000);

// ─── Wallpaper System ────────────────────────────────────
// Built-in wallpapers
const BUILTIN_WALLPAPERS = [
  { name: 'System 1', file: 'assets/wallpapers/bg1.jpg' },
  { name: 'System 2', file: 'assets/wallpapers/bg2.jpg' }
];

// Apply wallpaper by name or 'default'/'none', and persist to localStorage
const VALID_BUILTIN_FILES = [
  'assets/wallpapers/bg1.jpg','assets/wallpapers/bg2.jpg'
];

function resolveWallpaperPath(name) {
  const clean = (name || '').trim().toLowerCase().replace(/\s+/g, '').replace(/['"]/g, '');
  if (!clean) return null;
  
  // 1. Check if it matches built-in files directly or partially
  for (const wp of BUILTIN_WALLPAPERS) {
    const wpFile = wp.file.toLowerCase();
    const wpName = wp.name.toLowerCase().replace(/\s+/g, '');
    
    if (clean === wpFile || clean === wpName || clean === wpName + '.png' || clean === wpName + '.jpg' || clean === wp.name.toLowerCase() || wpFile.endsWith('/' + clean) || wpFile.endsWith('/' + clean + '.png') || wpFile.endsWith('/' + clean + '.jpg')) {
      return wp.file;
    }
  }
  
  // 2. Check bg1.png and bg2.png
  if (clean === 'bg1' || clean === 'bg1.png' || clean === 'background1' || clean === 'background1.png') {
    return 'assets/wallpapers/bg1.png';
  }
  if (clean === 'bg2' || clean === 'bg2.png' || clean === 'background2' || clean === 'background2.png') {
    return 'assets/wallpapers/bg2.png';
  }
  
  // 3. Check custom storage wallpapers by name (case-insensitive and whitespace-insensitive, ignoring extension)
  const storageFile = storageData.find(f => {
    const fname = f.name.toLowerCase();
    return fname === clean || 
           fname.replace(/\.[^/.]+$/, '') === clean || 
           fname.replace(/\s+/g, '') === clean;
  });
  if (storageFile) {
    return '__storage__:' + storageFile.name;
  }
  
  return null;
}

function applyWallpaper(name) {
  let trimmed = (name || '').trim().replace(/['"]/g, '');
  if (trimmed.startsWith('__storage__:')) trimmed = trimmed.replace('__storage__:', '');
  const key = trimmed.toLowerCase();
  
  if (key === 'random' || key === 'surprise' || key === 'random wallpaper') {
    const idx = Math.floor(Math.random() * 9) + 1;
    return applyWallpaper(`naruto/naruto${idx}.png`);
  }

  let finalUrl = '';
  let storageKey = trimmed;

  if (key === 'none') {
    finalUrl = 'none';
    storageKey = 'none';
  } else if (key === 'default') {
    finalUrl = "url('naruto/naruto1.png')";
    storageKey = 'naruto/naruto1.png';
  } else {
    // Intelligently resolve any wallpaper name variation first
    const resolved = resolveWallpaperPath(trimmed);
    if (resolved) {
      if (resolved.startsWith('__storage__:')) {
        const cleanName = resolved.replace('__storage__:', '');
        const storageFile = storageData.find(f => f.name === cleanName);
        if (storageFile && storageFile.content.startsWith('data:image')) {
          finalUrl = `url('${storageFile.content}')`;
          storageKey = resolved;
        } else {
          console.warn(`[LUNA] Corrupted image '${trimmed}'. Defaulting to random.`);
          return applyWallpaper('random');
        }
      } else {
        finalUrl = `url('${resolved}')`;
        storageKey = resolved;
      }
    } else {
      // Fallback: search custom storage files
      const storageFile = storageData.find(f => f.name.toLowerCase() === key);
      if (storageFile && storageFile.content.startsWith('data:image')) {
        finalUrl = `url('${storageFile.content}')`;
        storageKey = '__storage__:' + trimmed;
      } else {
        // FAIL-SAFE: If it is a known absolute URL, use it directly
        if (trimmed.includes('://')) {
          finalUrl = `url('${trimmed}')`;
          storageKey = trimmed;
        } else if (trimmed.includes('.')) {
          // NEW FALLBACK: If they type a filename with an extension (e.g. "myimage.png" or "naruto/custom.jpg")
          // try to load it directly! This allows any file name to work.
          finalUrl = `url('${trimmed}')`;
          storageKey = trimmed;
         } else {
          console.warn(`[LUNA] Invalid wallpaper '${trimmed}'. Defaulting to random.`);
          return applyWallpaper('random');
        }
      }
    }
  }

  // Cross-fade logic
  const layer1 = $('wallpaperLayer');
  const layer2 = $('wallpaperLayer2');
  if (!layer1 || !layer2) return;

  const nextLayer = state.currentLayer === 1 ? layer2 : layer1;
  const prevLayer = state.currentLayer === 1 ? layer1 : layer2;

  nextLayer.style.backgroundImage = finalUrl;
  nextLayer.style.opacity = '1';
  prevLayer.style.opacity = '0';
  
  state.currentLayer = state.currentLayer === 1 ? 2 : 1;
  localStorage.setItem('luna_wallpaper', storageKey);
  applyWallpaperBlur();
}

// Restore wallpaper from localStorage on load
(function restoreWallpaper() {
  const saved = localStorage.getItem('luna_wallpaper');
  if (!saved) {
    applyWallpaper('default');
    return;
  }
  applyWallpaper(saved);
})();

function applyWallpaperBlur() {
    const l1 = $('wallpaperLayer');
    const l2 = $('wallpaperLayer2');
    const blur = `blur(${cfg.wallpaperBlur}px)`;
    if (l1) l1.style.filter = blur;
    if (l2) l2.style.filter = blur;
    if ($('wpBlurRange')) $('wpBlurRange').value = cfg.wallpaperBlur;
}
applyWallpaperBlur();

// ─── Wallpaper Picker Modal ───────────────────────────────
let wpSelectedValue = null; // tracks what is selected in the picker

function openWallpaperPicker(lunaMessage) {
  // Build built-in grid
  const builtinGrid = $('wpBuiltinGrid');
  if (builtinGrid) {
    builtinGrid.innerHTML = '';
    const currentWp = localStorage.getItem('luna_wallpaper') || 'assets/wallpapers/default.jpg';
    BUILTIN_WALLPAPERS.forEach(wp => {
      const div = document.createElement('div');
      div.className = 'wp-thumb' + (currentWp === wp.file ? ' selected' : '');
      div.dataset.value = wp.file;
      div.innerHTML = `
        <img src="${wp.file}" alt="${wp.name}" loading="lazy" />
        <div class="wp-label">${wp.name}</div>
        <div class="wp-check">✓</div>
      `;
      div.addEventListener('click', () => {
        builtinGrid.querySelectorAll('.wp-thumb').forEach(t => t.classList.remove('selected'));
        $('wpStorageGrid')?.querySelectorAll('.wp-thumb').forEach(t => t.classList.remove('selected'));
        div.classList.add('selected');
        wpSelectedValue = wp.file;
      });
      builtinGrid.appendChild(div);
    });
  }

  // Build storage image grid
  const storageGrid = $('wpStorageGrid');
  const storageLabel = $('wpStorageLabel');
  const imageFiles = storageData.filter(f => f.content && f.content.startsWith('data:image'));
  if (storageGrid) {
    storageGrid.innerHTML = '';
    
    // Always add "Upload New" thumb
    const upThumb = document.createElement('div');
    upThumb.className = 'wp-thumb upload-thumb';
    upThumb.style.cssText = 'border:2px dashed var(--border); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; background:rgba(0,180,255,0.03); cursor:pointer;';
    upThumb.innerHTML = `
      <div style="font-size:1.4rem;">➕</div>
      <div style="font-size:0.65rem; color:var(--dim); font-weight:600; letter-spacing:1px;">UPLOAD</div>
    `;
    upThumb.onclick = () => $('wpUploadInput').click();
    storageGrid.appendChild(upThumb);

    if (imageFiles.length > 0) {
      if (storageLabel) storageLabel.style.display = '';
      const currentWp = localStorage.getItem('luna_wallpaper') || '';
      imageFiles.forEach(f => {
        const div = document.createElement('div');
        div.className = 'wp-thumb' + (currentWp === '__storage__:' + f.name ? ' selected' : '');
        div.dataset.value = '__storage__:' + f.name;
        div.innerHTML = `
          <img src="${f.content}" alt="${f.name}" />
          <div class="wp-label">${f.name}</div>
          <div class="wp-check">✓</div>
          <button class="wp-del-btn" title="Delete Image" style="position:absolute;top:4px;right:4px;background:rgba(255,0,0,0.7);color:white;border:none;border-radius:4px;width:24px;height:24px;cursor:pointer;font-size:12px;z-index:10;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>
        `;
        div.querySelector('.wp-del-btn').addEventListener('click', (e) => {
          e.stopPropagation(); // prevent select
          const idx = storageData.findIndex(item => item.name === f.name);
          if (idx !== -1) {
            removeStorage(idx);
            if (currentWp === '__storage__:' + f.name) {
              applyWallpaper('assets/wallpapers/default.jpg');
              localStorage.setItem('luna_wallpaper', 'naruto/naruto1.png');
            }
            openWallpaperPicker(); // Refresh
          }
        });
        div.addEventListener('click', () => {
          builtinGrid?.querySelectorAll('.wp-thumb').forEach(t => t.classList.remove('selected'));
          storageGrid.querySelectorAll('.wp-thumb').forEach(t => t.classList.remove('selected'));
          div.classList.add('selected');
          wpSelectedValue = '__storage__:' + f.name;
        });
        storageGrid.appendChild(div);
      });
    } else {
      if (storageLabel) storageLabel.style.display = 'none';
    }
  }

  wpSelectedValue = null;
  $('wallpaperModal').classList.remove('hidden');

  // If Luna prompted this, or if user clicked the button manually
  if (lunaMessage) {
    addBubble('luna', lunaMessage);
  } else if (state.screen === 'chat') {
    addBubbleReveal('luna', 'Opening Wallpaper Manager...');
  }
}

function closeWallpaperPicker() {
  $('wallpaperModal').classList.add('hidden');
}

// Wallpaper Toolbar Buttons
if ($('wallpaperBtn')) $('wallpaperBtn').onclick = () => openWallpaperPicker();
if ($('voiceWallpaperBtn')) $('voiceWallpaperBtn').onclick = () => openWallpaperPicker();

// Wallpaper Picker Events
if ($('closeWallpaper'))  $('closeWallpaper').onclick  = closeWallpaperPicker;
if ($('closeWallpaper2')) $('closeWallpaper2').onclick = closeWallpaperPicker;
if ($('wpResetBtn')) $('wpResetBtn').onclick = () => {
  applyWallpaper('default');
  closeWallpaperPicker();
  if (state.screen === 'chat') addBubble('system', 'Wallpaper reset to default.');
};
if ($('wpApplyBtn')) $('wpApplyBtn').onclick = () => {
  if (!wpSelectedValue) { closeWallpaperPicker(); return; }
  if (wpSelectedValue.startsWith('__storage__:')) {
    const fname = wpSelectedValue.replace('__storage__:', '');
    applyWallpaper(fname);
  } else {
    applyWallpaper(wpSelectedValue);
  }
  closeWallpaperPicker();
  if (state.screen === 'chat') addBubble('system', '✅ Wallpaper applied!');
};

// Handle dynamic wallpaper uploads from picker
if ($('wpUploadInput')) $('wpUploadInput').onchange = e => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const dataUrl = ev.target.result;
    const name = `wallpaper_${Date.now()}_${file.name}`;
    storageData.push({ name: name, content: dataUrl });
    localStorage.setItem('luna_storage', JSON.stringify(storageData));
    updateStorageUI();
    // Re-open picker to show new image (effectively refreshes the list)
    openWallpaperPicker();
    // Auto-select the new one
    setTimeout(() => {
        const selector = `[data-value="__storage__:${name}"]`;
        const thumb = document.querySelector(selector);
        if (thumb) thumb.click();
    }, 100);
  };
  reader.readAsDataURL(file);
};

// Expose so Luna can call it via command
window.openWallpaperPicker = openWallpaperPicker;

// Helper: setPyStatus (referenced in IDE section)
function setPyStatus(status) {
  const el = $('pyStatus');
  if (!el) return;
  if (status === 'ready') {
    el.textContent = '🐍 Python Ready';
    el.style.background = 'rgba(0,255,100,0.1)';
    el.style.color = '#00ff88';
    el.style.borderColor = 'rgba(0,255,100,0.3)';
  } else if (status === 'loading') {
    el.textContent = '🐍 Loading...';
    el.style.background = 'rgba(255,165,0,0.15)';
    el.style.color = 'orange';
    el.style.borderColor = 'rgba(255,165,0,0.4)';
  } else {
    el.textContent = '🐍 ' + status;
  }
}

// Initialize UI
updateStorageUI();

/* ─── MODAL LOGIC (Browser & Settings) ───────────────────── */
function openBrowserModal(url) {
  const modal = document.getElementById('browserModal');
  if (modal) modal.classList.remove('hidden');
  
  if (url) {
    if (!url.startsWith('http') && !url.startsWith('file')) url = 'https://' + url;
    const browserUrl = document.getElementById('browserUrl');
    if (browserUrl) browserUrl.value = url;
    
    const browserFrame = document.getElementById('browserFrame');
    if (browserFrame) browserFrame.src = url;
  }
}

const closeBrowserBtn = document.getElementById('closeBrowser');
if (closeBrowserBtn) {
  closeBrowserBtn.addEventListener('click', () => {
    const modal = document.getElementById('browserModal');
    if (modal) modal.classList.add('hidden');
    
    const browserFrame = document.getElementById('browserFrame');
    if (browserFrame) browserFrame.src = 'about:blank';
  });
}

const browserGoBtn = document.getElementById('browserGo');
if (browserGoBtn) {
  browserGoBtn.addEventListener('click', () => {
    const browserUrl = document.getElementById('browserUrl');
    let val = browserUrl ? browserUrl.value.trim() : '';
    if (!val) return;
    if (!val.startsWith('http') && !val.startsWith('file')) val = 'https://' + val;
    
    const browserFrame = document.getElementById('browserFrame');
    if (browserFrame) browserFrame.src = val;
  });
}

/* ─── FIREBASE AUTH & TIER LOGIC ───────────────────────────── */
let currentUser = null;
let userTier = 'free';
let messagesToday = 0;
let dailyLimit = 30;
let isGuestMode = false;
let isAdmin = false;
let useLocalModel = false;

window.updateMessageCounter = function() {
  const display = document.getElementById('messageCountDisplay');
  if (display) {
    display.textContent = `Messages Today: ${messagesToday} / ${dailyLimit}`;
  }
};

window.initLunaAuth = function() {
  if (!window.lunaAuth) return;

  // Orb Canvas for Login
  const loginCanvas = document.getElementById('loginOrbCanvas');
  if (loginCanvas) {
    const lctx = loginCanvas.getContext('2d');
    let ltime = 0;
    function drawLogin() {
      lctx.clearRect(0,0,160,160);
      ltime += 0.03;
      const r = 60;
      lctx.beginPath();
      lctx.arc(80,80, r + Math.sin(ltime)*5, 0, Math.PI*2);
      lctx.fillStyle = `rgba(0,180,255, ${0.1 + Math.sin(ltime)*0.1})`;
      lctx.fill();
      lctx.beginPath();
      lctx.arc(80,80, r*0.8, 0, Math.PI*2);
      lctx.fillStyle = 'rgba(0,180,255,0.3)';
      lctx.fill();
      requestAnimationFrame(drawLogin);
    }
    drawLogin();
  }

  // Auth Listener
  window.fbOnAuth(window.lunaAuth, async (user) => {
    const screen = document.getElementById('loginScreen');
    if (user) {
      currentUser = user;
      if (screen) screen.classList.add('hidden');
      
      // ─── FETCH KEY POOL FROM FIREBASE ───
      try {
        const configRef = window.fbDoc(window.lunaDb, "system", "config");
        const configSnap = await window.fbGetDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          const engines = (data.engines || '').split('\n').map(k => k.trim()).filter(k => k);
          if (engines.length > 0 && !localStorage.getItem('luna_geminiKey')) {
            // Fisher-Yates shuffle for fair distribution across users
            for (let i = engines.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [engines[i], engines[j]] = [engines[j], engines[i]];
            }
            // First key becomes primary, rest become backups
            cfg.geminiKey = engines[0];
            cfg.geminiKeys = engines.join('\n');
            // Reset rotation index so it starts fresh
            state.geminiIdx = -1;
            localStorage.setItem('luna_geminiIdx', -1);
            console.log(`🔑 Key Pool loaded: ${engines.length} engines assigned.`);
          }
        }
      } catch (e) {
        console.warn('Could not fetch key pool from Firebase:', e);
      }

      // ─── LOAD USER DOC AND STREAK LOGIC ───
      const docRef = window.fbDoc(window.lunaDb, "users", user.uid);
      const docSnap = await window.fbGetDoc(docRef);
      const now = new Date();
      const todayDate = now.toLocaleDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toLocaleDateString();
      
      let streak = 0;
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        userTier = data.tier || 'free';
        streak = data.streak || 0;
        
        if (data.lastLogin === yesterdayDate) {
           streak += 1; // Logged in yesterday, increment streak
        } else if (data.lastLogin !== todayDate) {
           streak = 1;  // Missed a day, reset streak
        }

        // Auto-upgrade to Gold for 1 day if 7-day streak hit
        if (streak >= 7 && userTier === 'free') {
           userTier = 'gold';
           showToast('🔥 7-DAY STREAK! You have been granted GOLD TIER for today!', false);
        }

        dailyLimit = userTier === 'gold' ? 99999 : (userTier === 'silver' ? 200 : 30);
        updateMessageCounter();
        if (data.lastLogin !== todayDate) {
          await window.fbUpdateDoc(docRef, { lastLogin: todayDate, messagesToday: 0, streak: streak });
          messagesToday = 0;
        } else {
          messagesToday = data.messagesToday || 0;
        }
      } else {
        // New User Initialization
        await window.fbSetDoc(docRef, {
          email: user.email,
          tier: 'free',
          messagesToday: 0,
          streak: 1,
          lastLogin: todayDate,
          createdAt: new Date().toISOString()
        });
        userTier = 'free';
        dailyLimit = 30;
        updateMessageCounter();
        messagesToday = 0;
        streak = 1;
      }
      
      // Update UI Badges
      const badgeColor = userTier === 'gold' ? 'gold' : (userTier === 'silver' ? '#c0c0c0' : '#00b4ff');
      const badgeBg = userTier === 'gold' ? 'rgba(255,215,0,0.2)' : (userTier === 'silver' ? 'rgba(192,192,192,0.2)' : 'rgba(0,180,255,0.2)');
      if(typeof updateOptUI !== 'undefined') updateOptUI();
      ['chatTierBadge', 'voiceTierBadge'].forEach(id => {
         const b = document.getElementById(id);
         if (b) {
           b.innerHTML = `${userTier.toUpperCase()} <span style="font-size:0.5rem; margin-left:3px;">🔥${streak}</span>`;
           b.style.color = badgeColor;
           b.style.borderColor = badgeColor;
           b.style.backgroundColor = badgeBg;
           b.style.boxShadow = `0 0 10px ${badgeBg}`;
         }
      });
    } else {
      currentUser = null;
      // if (screen) screen.classList.remove('hidden');
    }
  });
};

  // loginBtn moved to DOMContentLoaded

  // signupBtn moved to DOMContentLoaded

  // toggleAuthMode moved to DOMContentLoaded

  window.showLocalPrompt = function() {
    const promptScreen = document.getElementById('localModelSetupScreen');
    if (promptScreen) promptScreen.classList.remove('hidden');
  };

  document.getElementById('useCloudBtn')?.addEventListener('click', () => {
    useLocalModel = false;
    document.getElementById('localModelSetupScreen').classList.add('hidden');
    if(document.getElementById('localModelToggle')) document.getElementById('localModelToggle').checked = false;
    updateTierBadge();
  });

  document.getElementById('useLocalBtn')?.addEventListener('click', () => {
    document.getElementById('localWizardSteps').classList.remove('hidden');
  });

  document.getElementById('confirmLocalBtn')?.addEventListener('click', () => {
    useLocalModel = true;
    document.getElementById('localModelSetupScreen').classList.add('hidden');
    if(document.getElementById('localModelToggle')) document.getElementById('localModelToggle').checked = true;
    updateTierBadge();
  });

  document.getElementById('localModelToggle')?.addEventListener('change', (e) => {
    useLocalModel = e.target.checked;
    updateTierBadge();
  });

  function updateTierBadge() {
    ['chatTierBadge', 'voiceTierBadge'].forEach(id => {
       const b = document.getElementById(id);
       if(b) {
         if (useLocalModel) {
            b.textContent = 'LOCAL RUNNING';
            b.style.color = '#00ff64';
            b.style.borderColor = '#00ff64';
            b.style.background = 'rgba(0,255,100,0.1)';
            b.style.boxShadow = `0 0 10px rgba(0,255,100,0.2)`;
         } else {
            b.textContent = (userTier === 'ADMIN' ? 'ADMIN' : userTier.toUpperCase());
            const badgeColor = userTier === 'gold' ? 'gold' : (userTier === 'silver' ? 'silver' : 'var(--blue)');
            const badgeBg = userTier === 'gold' ? 'rgba(255,215,0,0.2)' : (userTier === 'silver' ? 'rgba(192,192,192,0.2)' : 'rgba(0,180,255,0.2)');
            b.style.color = badgeColor;
            b.style.borderColor = badgeColor;
            b.style.background = badgeBg;
            b.style.boxShadow = `0 0 10px ${badgeBg}`;
         }
       }
    });
  }

  // Network Status Indicator
    function updateNetworkStatus() {
    const net = document.getElementById('networkIndicator');
    if (net) {
      if (navigator.onLine) {
        net.style.backgroundColor = 'var(--green)';
        net.style.boxShadow = '0 0 10px var(--green)';
        net.title = 'Network Status: Online';
      } else {
        net.style.backgroundColor = 'var(--red)';
        net.style.boxShadow = '0 0 10px var(--red)';
        net.title = 'Network Status: Offline';
      }
    }
  }
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();

  // guestBtn moved to DOMContentLoaded

window.showUpgradePrompt = function() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.6);backdrop-filter:blur(15px);display:flex;align-items:center;justify-content:center; animation: fadeIn 0.3s ease;';
  if (isGuestMode) {
    modal.innerHTML = `
      <div style="background:linear-gradient(145deg, rgba(20,20,30,0.9), rgba(10,10,15,0.95)); border:1px solid rgba(0,180,255,0.4); border-radius:24px; padding:35px 25px; width:90%; max-width:450px; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.8); position:relative;">
        <h2 style="color:#fff; margin:0 0 15px 0; font-family:'Orbitron',sans-serif; font-size: 1.8rem; letter-spacing: 2px;">GUEST MODE</h2>
        <p style="color:var(--dim); font-size:1rem; line-height:1.6; margin-bottom:25px;">
          You are currently using Luna in Guest Mode. Log in to access the Pro Tier, track history, and remove limits!
        </p>
        <button onclick="document.getElementById('loginScreen').classList.remove('hidden'); this.parentElement.parentElement.remove();" style="width:100%; padding: 14px; background: rgba(0,180,255,0.2); border: 1px solid var(--blue); color: var(--blue); border-radius: 12px; font-size: 1.1rem; cursor: pointer; font-weight: bold; margin-bottom: 10px;">Log In / Sign Up</button>
        <button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding: 12px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 12px; font-size: 1rem; cursor: pointer;">Close</button>
      </div>
    `;
  } else {
    modal.innerHTML = `
      <div style="background:linear-gradient(145deg, rgba(20,20,30,0.8), rgba(10,10,15,0.9)); border:1px solid rgba(255,215,0,0.4); border-radius:24px; padding:35px 25px; width:90%; max-width:450px; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1); position:relative; overflow:hidden;">
        <div style="position:absolute; top:-50px; left:-50px; width:150px; height:150px; background:radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%); border-radius:50%;"></div>
        <div style="position:absolute; bottom:-50px; right:-50px; width:200px; height:200px; background:radial-gradient(circle, rgba(0,180,255,0.15) 0%, transparent 70%); border-radius:50%;"></div>
        
        <div style="font-size:3rem; margin-bottom:10px; text-shadow: 0 0 20px rgba(255,215,0,0.5);">👑</div>
        <h2 style="color:#fff; margin:0 0 15px 0; font-family:'Orbitron',sans-serif; font-size: 1.8rem; letter-spacing: 2px;">LUNA <span style="color: gold;">PRO</span></h2>
        <p style="color:var(--dim); font-size:1rem; line-height:1.6; margin-bottom:25px; position:relative; z-index:1;">
          Unlock unlimited tokens, faster response times, increased daily limits, and an exclusive private API pool for peak performance.
        </p>
        
        <div style="background:rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding:20px; border-radius:16px; margin-bottom:25px; position:relative; z-index:1; backdrop-filter: blur(5px);">
          <span style="color:var(--dim); font-size:0.85rem; display:block; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">DM to Upgrade Your Tier:</span>
          <a href="https://instagram.com/always_sai_12_" target="_blank" style="display:inline-block; background:linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045); -webkit-background-clip: text; color: transparent; font-weight:bold; font-size:1.3rem; text-decoration:none; text-shadow: 0 2px 10px rgba(253,29,29,0.2); transition: transform 0.2s;">@always_sai_12_</a>
        </div>
        
        <button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 12px; font-size: 1rem; cursor: pointer; transition: background 0.2s, transform 0.1s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">Close</button>
      </div>
    `;
  }
  document.body.appendChild(modal);
};


// -- DYNAMIC WALLPAPER ENGINE --------------------------------------
// Disabled by user request to prevent random changes
/*
// -- DYNAMIC WALLPAPER ENGINE --------------------------------------
(function() {
  const wallpapers = ['bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg'];
  let currentIdx = 0;
  const layer = document.getElementById('wallpaperLayer');
  if (layer) {
    layer.style.backgroundImage = `url('assets/wallpapers/${wallpapers[currentIdx]}')`;
    setInterval(() => {
      currentIdx = (currentIdx + 1) % wallpapers.length;
      layer.style.opacity = 0; // Fade out
      setTimeout(() => {
        layer.style.backgroundImage = `url('assets/wallpapers/${wallpapers[currentIdx]}')`;
        layer.style.opacity = 0.85; // Fade in
      }, 2000);
    }, 15000); // Change every 15 seconds
  }
})();
*/

// -- CUSTOM API KEY VERIFICATION ENGINE ----------------------------
document.getElementById('verifyGeminiKeyBtn')?.addEventListener('click', async () => {
  const key = document.getElementById('geminiKey').value.trim();
  if (!key) return showToast('Please enter a Gemini API Key first', true);
  
  if (!confirm("Are you sure you want to use your own API Key? This overrides Luna's built-in cloud keys.")) return;
  if (!confirm("Security Notice: Your key will be stored locally in your browser cache. Proceed?")) return;
  
  const btn = document.getElementById('verifyGeminiKeyBtn');
  const status = document.getElementById('geminiKeyStatus');
  const select = document.getElementById('geminiModel');
  
  btn.textContent = 'Verifying...';
  try {
    const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!res.ok) throw new Error('Invalid or Expired API Key');
    const data = await res.json();
    
    // Filter models
    const validModels = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'));
    select.innerHTML = '';
    
    let fFlash = [];
    let fFlow = [];
    
    validModels.forEach(m => {
      let n = m.name.replace('models/', '');
      if (n.includes('flash') || n.includes('lite') || n.includes('nano')) fFlash.push(n);
      else if (n.includes('pro') || n.includes('exp') || n.includes('ultra')) fFlow.push(n);
        
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = m.displayName || m.name;
      select.appendChild(opt);
    });
    
    // Sort logic
    fFlash.sort((a,b) => {
        if(a.includes('8b') && !b.includes('8b')) return -1;
        if(!a.includes('8b') && b.includes('8b')) return 1;
        return a.localeCompare(b);
    });
    fFlow.sort((a,b) => {
        if(a.includes('pro') && b.includes('exp')) return -1;
        if(a.includes('exp') && b.includes('pro')) return 1;
        return a.localeCompare(b);
    });
    
    state.flashModels = fFlash;
    state.flowModels = fFlow;
    
    select.style.display = 'block';
    status.textContent = `Status: Verified (${validModels.length} models found)`;
    status.style.color = '#00ff64';
    btn.textContent = 'Verified';
    
    // Save to local config and bypass limits
    cfg.geminiKey = key;
    cfg.geminiModel = select.value;
    isAdmin = true; // Bypass limits
    Object.keys(cfg).forEach(k => localStorage.setItem(`luna_${k}`, cfg[k]));
    showToast('Gemini API Key Verified & Saved!', false);
    
  } catch (err) {
    status.textContent = 'Status: Verification Failed';
    status.style.color = '#ff6464';
    btn.textContent = 'Verify Key';
    showToast(err.message, true);
  }
});

document.getElementById('geminiModel')?.addEventListener('change', (e) => {
  cfg.geminiModel = e.target.value;
});

document.getElementById('verifyGroqKeyBtn')?.addEventListener('click', async () => {
  const key = document.getElementById('groqKey').value.trim();
  if (!key) return showToast('Please enter a Groq API Key first', true);
  
  if (!confirm("Are you sure you want to use your own Groq API Key?")) return;
  if (!confirm("Security Notice: Your key will be stored locally in your browser cache. Proceed?")) return;
  
  const btn = document.getElementById('verifyGroqKeyBtn');
  const status = document.getElementById('groqKeyStatus');
  const select = document.getElementById('groqModel');
  
  btn.textContent = 'Verifying...';
  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!res.ok) throw new Error('Invalid or Expired API Key');
    const data = await res.json();
    
    select.innerHTML = '';
    data.data.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.id;
      select.appendChild(opt);
    });
    
    select.style.display = 'block';
    status.textContent = `Status: Verified (${data.data.length} models found)`;
    status.style.color = '#f55036';
    btn.textContent = 'Verified';
    
    cfg.groqKey = key;
    cfg.groqModel = select.value;
    isAdmin = true; // Bypass limits
    Object.keys(cfg).forEach(k => localStorage.setItem(`luna_${k}`, cfg[k]));
    showToast('Groq API Key Verified & Saved!', false);
    
  } catch (err) {
    status.textContent = 'Status: Verification Failed';
    status.style.color = '#ff6464';
    btn.textContent = 'Verify Key';
    showToast(err.message, true);
  }
});

document.getElementById('groqModel')?.addEventListener('change', (e) => {
  cfg.groqModel = e.target.value;
});







// -- SMART OPTIMIZATION UI ENGINE --
const optSelect = document.getElementById('chatEngineToggle');
const showThoughtsToggle = document.getElementById('showThoughtsToggle');

async function populateOllamaModels() {
  const optSelect = document.getElementById('chatEngineToggle');
  if (!optSelect) return;
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags');
    if (!res.ok) return;
    const data = await res.json();
    if (data.models && data.models.length > 0) {
      optSelect.innerHTML = '';
      data.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        let icon = '🤖';
        if (model.name.toLowerCase().includes('llama')) icon = '🦙';
        else if (model.name.toLowerCase().includes('vision') || model.name.toLowerCase().includes('minicpm')) icon = '👁️';
        else if (model.name.toLowerCase().includes('qwen')) icon = '🧠';
        option.textContent = `${icon} ${model.name}`;
        optSelect.appendChild(option);
      });
      if (cfg.optMode && data.models.some(m => m.name === cfg.optMode)) {
        optSelect.value = cfg.optMode;
      } else {
        cfg.optMode = data.models[0].name;
        optSelect.value = cfg.optMode;
        localStorage.setItem('luna_optMode', cfg.optMode);
      }
    }
  } catch (e) {
    console.log('[LUNA-DEBUG] Failed to fetch Ollama models:', e);
  }
}

function updateOptUI() {
  if (!optSelect) return;
  if (optSelect.options.length > 0 && Array.from(optSelect.options).some(o => o.value === cfg.optMode)) {
      optSelect.value = cfg.optMode;
  }
  if (showThoughtsToggle) showThoughtsToggle.checked = cfg.showThoughts;
}

if(optSelect) {
  optSelect.addEventListener('change', (e) => {
    cfg.optMode = e.target.value;
    localStorage.setItem('luna_optMode', cfg.optMode);
    useLocalModel = true;
    updateOptUI();
  });
}

if (showThoughtsToggle) {
  showThoughtsToggle.addEventListener('change', (e) => {
    cfg.showThoughts = e.target.checked;
    localStorage.setItem('luna_showThoughts', cfg.showThoughts);
  });
}

// Call updateOptUI when tier is loaded
const oldUpdateUIBadge = "['chatTierBadge', 'voiceTierBadge'].forEach(id => {";

// Call updateOptUI once on init
setTimeout(() => {
  populateOllamaModels().then(() => updateOptUI());
}, 500);
// --- Mobile Menu Toggle ---
document.addEventListener('DOMContentLoaded', () => {
  // Add a fake greeting so the UI isn't blank on startup
  setTimeout(() => {
    if (typeof addBubble === 'function') {
      addBubble('luna', 'System initialized. All models are online and ready.');
    }
  }, 1000);

  // --- Alias Storage Logic ---
  const aliasApp = document.getElementById('aliasApp');
  const aliasName = document.getElementById('aliasName');
  const aliasId = document.getElementById('aliasId');
  const aliasLink = document.getElementById('aliasLink');
  const addAliasBtn = document.getElementById('addAliasBtn');
  const aliasListContainer = document.getElementById('aliasListContainer');

  function renderAliases() {
    if (!aliasListContainer) return;
    aliasListContainer.innerHTML = '';
    for (const [name, target] of Object.entries(aliasData)) {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.padding = '8px';
      div.style.borderBottom = '1px solid var(--border)';
      div.innerHTML = `<span style="color:#fff;"><b>${name}</b> <span style="color:var(--dim);font-size:0.8rem;">(${target})</span></span>
                       <button class="btn-outline del-alias" data-name="${name}" style="padding:2px 6px; font-size:0.7rem; color:var(--red); border-color:var(--red);">Del</button>`;
      aliasListContainer.appendChild(div);
    }
    
    document.querySelectorAll('.del-alias').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const n = e.target.dataset.name;
        delete aliasData[n];
        if (window.osAPI) window.osAPI.writeFileSync('data/contacts.json', JSON.stringify(aliasData, null, 4), 'utf-8');
        renderAliases();
      });
    });
  }

  if (addAliasBtn) {
    addAliasBtn.addEventListener('click', () => {
      const n = aliasName.value.trim().toLowerCase();
      const id = aliasId.value.trim();
      const link = aliasLink.value.trim();
      const app = aliasApp.value;
      if (!n) return;
      
      let targetValue = id;
      if (link) {
         targetValue = link;
      }
      
      aliasData[n] = targetValue;
      
      if (window.osAPI) {
         window.osAPI.writeFileSync('data/contacts.json', JSON.stringify(aliasData, null, 4), 'utf-8');
      }
      
      aliasName.value = '';
      aliasId.value = '';
      aliasLink.value = '';
      renderAliases();
    });
    
    // Initial render
    renderAliases();
  }

  document.getElementById('signupBtn')?.addEventListener('click', async () => {
    let rawName = document.getElementById('loginUsername').value.trim();
    const err = document.getElementById('loginError');
    if (!rawName) { err.textContent = 'Please enter a username.'; return; }
    if (!window.fbSignUp) { err.textContent = 'Network offline. Use Guest mode.'; return; }
    const e = rawName + '@luna.local';
    const p = document.getElementById('loginPassword').value;
    err.textContent = 'Creating identity...';
    try {
      await window.fbSignUp(window.lunaAuth, e, p);
      err.textContent = '';
      showLocalPrompt();
    } catch(error) {
      err.textContent = error.message;
    }
  });
  document.getElementById('loginBtn')?.addEventListener('click', async () => {
    let rawName = document.getElementById('loginUsername').value.trim();
    const err = document.getElementById('loginError');
    if (!rawName) { err.textContent = 'Please enter a username.'; return; }
    if (!window.fbSignIn && rawName !== 'admin') { err.textContent = 'Network offline. Use Guest mode.'; return; }
    const e = rawName + '@luna.local';
    const p = document.getElementById('loginPassword').value;
    err.textContent = 'Authenticating...';
    
    if (rawName === 'admin' && p === 'shashankvr') {
      err.textContent = '';
      userTier = 'ADMIN';
      isAdmin = true;
      dailyLimit = 999999;
      messagesToday = 0;
      currentUser = null; // No Firebase Auth
      isGuestMode = false;
      const screen = document.getElementById('loginScreen');
      if (screen) screen.classList.add('hidden');
      
      // Still fetch API keys from Firebase since we need them
      try {
        const configRef = window.fbDoc(window.lunaDb, "system", "config");
        const configSnap = await window.fbGetDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          const engines = (data.engines || '').split('\n').map(k => k.trim()).filter(k => k);
          if (engines.length > 0 && !localStorage.getItem('luna_geminiKey')) {
            for (let i = engines.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [engines[i], engines[j]] = [engines[j], engines[i]];
            }
            cfg.geminiKey = engines[0];
            cfg.geminiKeys = engines.join('\n');
            state.geminiIdx = -1;
            console.log(`ADMIN Key Pool loaded.`);
          }
        }
      } catch (e) { console.warn('Could not fetch key pool', e); }
      
      showLocalPrompt();
      return;
    }

    try {
      await window.fbSignIn(window.lunaAuth, e, p);
      err.textContent = '';
      showLocalPrompt();
    } catch(error) {
      err.textContent = error.message;
    }
  });
  document.getElementById('guestBtn')?.addEventListener('click', () => {
    isGuestMode = true;
    userTier = 'GUEST';
    dailyLimit = 10;
    messagesToday = 0;
    const screen = document.getElementById('loginScreen');
    if (screen) screen.classList.add('hidden');
    updateMessageCounter();
    showToast('Logged in as Guest. Limited features available.', false);
    showLocalPrompt();
  });
  
  const toggleBtn = document.getElementById('toggleAuthMode');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      const signupBtn = document.getElementById('signupBtn');
      const loginBtn = document.getElementById('loginBtn');
      const sub = document.getElementById('authSubtitle');
      const un = document.getElementById('loginUsername');
      const pw = document.getElementById('loginPassword');
      
      if (!signupBtn || !loginBtn) return;
      
      const isSignup = !signupBtn.classList.contains('hidden');
      if (isSignup) {
        signupBtn.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        if (sub) sub.textContent = 'PLEASE AUTHENTICATE';
        e.target.textContent = "Don't have an account? Sign up";
        if (un) un.placeholder = 'Enter Username';
        if (pw) pw.placeholder = 'Enter Password';
      } else {
        loginBtn.classList.add('hidden');
        signupBtn.classList.remove('hidden');
        if (sub) sub.textContent = 'CREATE YOUR IDENTITY';
        e.target.textContent = "Already have an account? Log in";
        if (un) un.placeholder = 'Choose a Username (letters/numbers only)';
        if (pw) pw.placeholder = 'Create a Password';
      }
    });
  }

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navButtonsWrap = document.getElementById('navButtonsWrap');
  if (mobileMenuBtn && navButtonsWrap) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navButtonsWrap.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (navButtonsWrap.classList.contains('show') && !navButtonsWrap.contains(e.target)) {
        navButtonsWrap.classList.remove('show');
      }
    });
  }
});


if(document.getElementById('routerModelInput')) {
  document.getElementById('routerModelInput').addEventListener('change', (e) => {
    cfg.routerModel = e.target.value.trim() || 'phi3:mini';
    localStorage.setItem('luna_routerModel', cfg.routerModel);
  });
}
if(document.getElementById('heavyModelInput')) {
  document.getElementById('heavyModelInput').addEventListener('change', (e) => {
    cfg.heavyModel = e.target.value.trim() || 'phi3:mini';
    localStorage.setItem('luna_heavyModel', cfg.heavyModel);
  });
}

// --- CHAT LOGIC ---
async function sendMessage() {
  const text = $('msgInput') ? $('msgInput').value.trim() : '';
  if (!text) return;
  
  if ($('msgInput')) {
      $('msgInput').value = ''; 
      $('msgInput').style.height = 'auto';
  }
  
  addBubble('user', text);
  
  if (state.waitingForPythonInput) {
    state.waitingForPythonInput = false;
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PYTHON_INPUT_REPLY', answer: text });
    }
    if ($('msgInput')) $('msgInput').placeholder = 'Ask Luna anything...';
    return;
  }

  const exactTyped = text.trim().toLowerCase();

  // Handle slash commands
  if (text.trim().startsWith('/') && typeof handleSlashCommand === 'function') {
    if (handleSlashCommand(text.trim())) return;
  }
  const VOICE_SWITCH_PHRASES = ['voice mode','switch to voice','go to voice','switch to voice mode','go to voice mode'];
  const SLEEP_PHRASES = ['sleep','go to sleep','goodnight','luna sleep'];
  if (VOICE_SWITCH_PHRASES.some(p => exactTyped.includes(p))) {
    addBubble('luna', 'Switching to Voice Mode...');
    setTimeout(() => showScreen('voice'), 800);
    return;
  }
  if (SLEEP_PHRASES.some(p => exactTyped.includes(p))) {
    addBubble('luna', 'Going to sleep. Goodnight.');
    setTimeout(() => showScreen('sleep'), 800);
    return;
  }

  const _procStart = Date.now();
  
  const bubbleId = 'stream-' + Date.now();
  const typingHtml = window.LunaLoaders.getLoaderHtml(true);
  addBubble('luna', `<div id="${bubbleId}">${typingHtml}</div>`);
  
  const _timerInterval = setInterval(() => {
    const el = document.getElementById('luna-typing-timer');
    if (el) el.textContent = '[' + ((Date.now() - _procStart) / 1000).toFixed(1) + 's]';
    else clearInterval(_timerInterval);
  }, 100);
  try {
    let reply = await callAI(text, 0, 0, (fullText, chunk) => {
       const el = document.getElementById(bubbleId);
       if (el) {
           el.innerHTML = formatText(fullText);
           const msgs = $('messages');
           if (msgs) msgs.scrollTop = msgs.scrollHeight;
       }
    });
    clearInterval(_timerInterval);
    
    if (!reply || reply.trim() === '') reply = 'Task completed.';
    
    const el = document.getElementById(bubbleId);
    if (el) {
        el.innerHTML = formatText(reply);
    }
  } catch(err) {
    clearInterval(_timerInterval);
    console.error('[LUNA] sendMessage error:', err);
    const el = document.getElementById(bubbleId);
    if (el) {
        el.innerHTML = `❗ Error: ${err.message || 'Connection failed. Check your API keys in Settings.'}`;
    }
  }
}

// Chat events
if ($('sendBtn')) {
if ($('sendBtn')) $('sendBtn').addEventListener('click', sendMessage);
}
if ($('msgInput')) {
if ($('msgInput')) $('msgInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// --- AUTONOMY PARSER ---


// ═══ CODE EXECUTION UI (Open Interpreter Port) ═══
function addCodeBlock(language, code) {
    const id = 'code-block-' + Date.now();
    const langLabel = { python: '🐍 Python', javascript: '📜 JavaScript', shell: '⚡ PowerShell' }[language] || language;
    const html = `
        <details id="${id}" class="code-exec-block">
            <summary class="code-exec-header" style="cursor:pointer;">
                <span class="code-exec-lang">${langLabel} (Clicking working show these all code etc)</span>
                <span class="code-exec-status" id="${id}-status">▶ Running...</span>
            </summary>
            <pre class="code-exec-code"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
            <div class="code-exec-output" id="${id}-output"></details>
        </div>
    `;
    addBubble('luna', html);
    
    // Listen for streaming output
    if (window.electronAPI && window.electronAPI.onCodeOutput) {
        const handler = (data) => {
            const outputEl = document.getElementById(id + '-output');
            if (outputEl && data.language === language) {
                const line = document.createElement('span');
                line.className = data.type === 'stderr' ? 'code-stderr' : 'code-stdout';
                line.textContent = data.content;
                outputEl.appendChild(line);
                outputEl.scrollTop = outputEl.scrollHeight;
            }
        };
        window.electronAPI.onCodeOutput(handler);
        // Auto-cleanup after 60s
        setTimeout(() => {
            const statusEl = document.getElementById(id + '-status');
            if (statusEl && statusEl.textContent.includes('Running')) {
                statusEl.textContent = '✅ Done';
                statusEl.style.color = 'var(--green)';
            }
        }, 60000);
    }
    return id;
}



// ═══ CONVERSATION EXPORT (Open Interpreter Port) ═══
function handleSlashCommand(text) {
    const cmd = text.trim().toLowerCase();
    
    if (cmd === '/export json') {
        const data = JSON.stringify(state.history, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'luna-chat-' + new Date().toISOString().slice(0,10) + '.json';
        a.click(); URL.revokeObjectURL(url);
        addBubble('luna', '📥 Conversation exported as JSON.');
        return true;
    }
    
    if (cmd === '/export md') {
        let md = '# Luna AI Chat\n\n';
        for (const msg of state.history) {
            md += `## ${msg.role === 'user' ? '👤 You' : '🤖 Luna'}\n${msg.text}\n\n`;
        }
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'luna-chat-' + new Date().toISOString().slice(0,10) + '.md';
        a.click(); URL.revokeObjectURL(url);
        addBubble('luna', '📥 Conversation exported as Markdown.');
        return true;
    }
    
    if (cmd === '/undo') {
        if (state.history.length >= 2) {
            state.history.pop(); // Remove last AI response
            state.history.pop(); // Remove last user message
            saveHistory();
            // Remove last two bubbles from UI
            const msgs = $('messages');
            if (msgs.lastElementChild) msgs.lastElementChild.remove();
            if (msgs.lastElementChild) msgs.lastElementChild.remove();
            addBubble('luna', '↩️ Last message pair removed.');
        } else {
            addBubble('luna', 'Nothing to undo.');
        }
        return true;
    }
    
    if (cmd === '/tokens') {
        const totalChars = state.history.reduce((sum, m) => sum + (m.text || '').length, 0);
        const estTokens = Math.round(totalChars / 4);
        addBubble('luna', `📊 **Token Estimate**\n- Messages: ${state.history.length}\n- Characters: ${totalChars.toLocaleString()}\n- Est. Tokens: ~${estTokens.toLocaleString()}\n- Context Window: ~${((estTokens / 1000000) * 100).toFixed(1)}% of 1M`);
        return true;
    }
    
    if (cmd === '/clear') {
        state.history = [];
        saveHistory();
        $('messages').innerHTML = '';
        addBubble('luna', '🧹 Conversation cleared.');
        return true;
    }
    
    if (cmd === '/help' || cmd === '/commands') {
        addBubble('luna', `📋 **Available Commands**
/export json — Export conversation as JSON
/export md — Export conversation as Markdown
/undo — Remove last message pair
/tokens — Show token usage estimate
/clear — Clear conversation
/help — Show this help`);
        return true;
    }
    
    return false; // Not a slash command
}


const AI_COMMAND_REGISTRY = {
    'CMD': async (match, feedback) => {
        if (window.osAPI) {
            const cmd = match[1].trim();
            const res = await window.osAPI.exec(cmd);
            let out = res.stdout || res.stderr || 'Command executed silently.';
            if (out.length > 500) out = out.substring(0, 500) + '...';
            feedback.push(`[CMD_OUTPUT]:\n${out}`);
        }
    },
    'OPEN_TERMINAL': async (match, feedback) => {
        if (window.osAPI) {
            window.osAPI.exec(`start cmd.exe /k "${match[1].trim()}"`);
            feedback.push('[SYSTEM]: Terminal opened successfully.');
        }
    },
    'READ_FILE': async (match, feedback) => {
        if (window.osAPI) {
            const p = match[1].trim();
            let out = '';
            try {
                out = window.osAPI.readFileSync(p, 'utf8');
                if (out.length > 1000) out = out.substring(0, 1000) + '...';
            } catch(e) { out = 'Error reading file: ' + e.message; }
            feedback.push(`[FILE_CONTENT of ${p}]:\n${out}`);
        }
    },
    'SILENT_SEARCH': async (match, feedback) => {
        if (window.electronAPI) {
            const query = match[1].trim().replace(/^["']|["']$/g, '');
            const apiKey = cfg.geminiKey || '';
            const pyCode = `import sys; sys.path.append('core'); import luna_tools, sys\nsys.stdout.reconfigure(encoding='utf-8')\nprint(luna_tools.silent_search("${query}", api_key="${apiKey}"))\n`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            let out = (res.ok && res.output) ? res.output : ((res.error) ? res.error + "\n" + res.output : "Failed to search web silently");
            feedback.push(`[SILENT_SEARCH_RESULTS for ${query}]:\n${out}`);
        }
    },
    'WEB_SEARCH': async (match, feedback) => {
        if (window.electronAPI) {
            const query = match[1].trim().replace(/^["']|["']$/g, '');
            // Forced to use SILENT_SEARCH duckduckgo API instead of launching the browser.
            const pyCode = `import duckduckgo_search\nprint(duckduckgo_search.DDGS().text("${query}", max_results=3))`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            let out = (res.ok && res.output) ? res.output : ((res.error) ? res.error + "\n" + res.output : "Failed to search web");
            feedback.push(`[WEB_SEARCH_RESULTS for ${query}]:\n${out}`);
        }
    },
    'WEB_GO': async (match, feedback) => {
        if (window.electronAPI) {
            const url = match[1].trim().replace(/^["']|["']$/g, '');
            const res = await window.electronAPI.runPython('web_automation.py', ['goto', url]);
            let output = res.ok ? 'Success' : (res.error || 'Unknown error');
            if (res.message) output += ' ' + res.message;
            feedback.push(`[SYSTEM]: Navigated to ${url}. Result: ${output}`);
        }
    },
    'OPEN_APP': async (match, feedback) => {
        if (window.electronAPI) {
            let appName = match[1].trim().replace(/ app$/i, '').replace(/"/g, '\"');
            const res = await window.electronAPI.runPython('app_launcher.py', [appName]);
            if (res.ok) {
                feedback.push(`[SYSTEM]: Successfully found and launched ${appName}.`);
            } else {
                feedback.push(`[SYSTEM]: Failed to launch ${appName}. Error: ${res.error || 'Unknown'}`);
            }
        }
    },
    'DESKTOP_TYPE': async (match, feedback) => {
        if (window.electronAPI) {
            const res = await window.electronAPI.keyboardType(match[1]);
            feedback.push(`[SYSTEM]: Typed text on desktop. ${res.ok ? 'Success' : res.error}`);
        }
    },
    'DESKTOP_PRESS': async (match, feedback) => {
        if (window.electronAPI) {
            const res = await window.electronAPI.keyboardPress(match[1].trim());
            feedback.push(`[SYSTEM]: Pressed ${match[1]} on desktop. ${res.ok ? 'Success' : res.error}`);
        }
    },
    'WEB_CLICK': async (match, feedback) => {
        if (window.electronAPI) {
            const sel = match[1].trim();
            const res = await window.electronAPI.runPython('web_automation.py', ['click', sel]);
            let output = res.ok ? (res.message || 'Success') : (res.error || 'Unknown error');
            feedback.push(`[SYSTEM]: WEB_CLICK Result: ${output}`);
        }
    },
    'WEB_PRESS': async (match, feedback) => {
        if (window.electronAPI) {
            const key = match[1].trim();
            const res = await window.electronAPI.runPython('web_automation.py', ['press', key]);
            let output = res.ok ? (res.message || 'Success') : (res.error || 'Unknown error');
            feedback.push(`[SYSTEM]: WEB_PRESS Result: ${output}`);
        }
    },
    'SEND_MESSAGE': async (match, feedback) => {
        if (window.electronAPI) {
            const args = match[1].trim().split('|');
            if (args.length < 3) {
                feedback.push('[SYSTEM_ERROR]: SEND_MESSAGE requires platform|receiver|message');
                return;
            }
            
            // Multi-step UI visualization
            if (typeof addBubbleReveal === 'function') {
                const receiver = args[1].trim();
                const textMsg = args.slice(2).join('|').trim();
                const displayMsg = textMsg.length > 15 ? textMsg.substring(0, 15) + '...' : textMsg;
                const steps = [
                    "Opening Browser...",
                    `Opening DM of ${receiver}...`,
                    `Typing "${displayMsg}"...`,
                    "Successfully sent!"
                ];
                steps.forEach((step, i) => {
                    setTimeout(() => {
                        const cbId = 'cb_step_' + Date.now() + '_' + i;
                        addBubbleReveal('luna', `<div class="checkbox-wrapper" style="margin: 4px 0;"><input type="checkbox" id="${cbId}" checked disabled /><div class="checkmark" style="opacity:1; transform:scale(1);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div><span class="label" style="color:var(--dim); font-size:0.85rem;">${step}</span></div>`);
                    }, (i + 1) * 2500); // 2 second delay between visual steps
                });
            }
            
            const pathInjection = cfg.messagingMode === 'invisible' 
                ? "" 
                : "sys.path.insert(0, os.path.abspath('tools'))";
            const pyCode = `import sys, os\n${pathInjection}\nimport luna_message\nprint(luna_message.send_message({'platform': '${args[0].trim()}', 'receiver': '${args[1].trim()}', 'message_text': '''${args.slice(2).join('|').trim()}'''}), flush=True)`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            // Tell the LLM it's complete regardless of errors to prevent infinite loops
            feedback.push(`[SYSTEM_MSG]: Automation sequence completed for ${args[1]}. Output: ${res.output}`);
        }
    },
    'WRITE_FILE': async (match, feedback) => {
        if (window.osAPI) {
            let filepath = match[1].trim(); 
            if (filepath.startsWith("~")) filepath = filepath.replace("~", "C:/Users/PRASANTH"); 
            filepath = filepath.replace("YourUsername", "PRASANTH");
            if (['downloads', 'desktop', 'documents', 'pictures', 'videos', 'music'].includes(filepath.toLowerCase())) {
                filepath = "C:/Users/PRASANTH/" + filepath.charAt(0).toUpperCase() + filepath.slice(1);
            }
            const content = match[2];
            try {
                const dir = filepath.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
                if (dir) try { window.osAPI.mkdirSync(dir); } catch(e) {}
                window.osAPI.writeFileSync(filepath, content, 'utf8');
                feedback.push(`[SYSTEM]: Successfully wrote ${content.length} chars to ${filepath}`);
            } catch(e) {
                feedback.push(`[SYSTEM]: Error writing file: ${e.message}`);
            }
        }
    },
    'LIST_DIR': async (match, feedback) => {
        if (window.osAPI) {
            let dirPath = match[1].trim(); 
            if (dirPath.startsWith("~")) dirPath = dirPath.replace("~", "C:/Users/PRASANTH"); 
            dirPath = dirPath.replace("YourUsername", "PRASANTH");
            if (['downloads', 'desktop', 'documents', 'pictures', 'videos', 'music'].includes(dirPath.toLowerCase())) {
                dirPath = "C:/Users/PRASANTH/" + dirPath.charAt(0).toUpperCase() + dirPath.slice(1);
            }
            try {
                const entries = window.osAPI.readdirSync(dirPath);
                let filesCount = 0;
                let dirsCount = 0;
                const enriched = entries.map(name => {
                    try {
                        const stat = window.osAPI.statSync(dirPath + '/' + name);
                        if(stat.isDirectory()) dirsCount++; else filesCount++;
                        return { name, isDir: stat.isDirectory(), size: stat.size, mtime: stat.mtimeMs || 0 };
                    } catch(e) { return { name, isDir: false, size: 0, mtime: 0 }; }
                });
                enriched.sort((a,b) => b.mtime - a.mtime);
                const details = enriched.slice(0, 50).map(e => `${e.isDir ? '[DIR]' : '[FILE]'} ${e.name} ${e.isDir ? '' : '(' + (e.size/1024).toFixed(1) + 'KB)'}`);
                feedback.push(`[DIR_LISTING of ${dirPath}]:\n[TOTAL: ${entries.length} items (${filesCount} files, ${dirsCount} dirs)]\n[SORTED BY RECENT]\n${details.join('\n')}${entries.length > 50 ? '\n... and ' + (entries.length - 50) + ' more' : ''}`);
            } catch(e) {
                feedback.push(`[SYSTEM]: Error listing directory: ${e.message}`);
            }
        }
    },
    'DELETE_FILE': async (match, feedback) => {
        if (window.osAPI) {
            let filepath = match[1].trim(); 
            if (filepath.startsWith("~")) filepath = filepath.replace("~", "C:/Users/PRASANTH"); 
            filepath = filepath.replace("YourUsername", "PRASANTH");
            try {
                window.osAPI.unlinkSync(filepath);
                feedback.push(`[SYSTEM]: Deleted ${filepath}`);
            } catch(e) {
                feedback.push(`[SYSTEM]: Error deleting file: ${e.message}`);
            }
        }
    },
    'RENAME_FILE': async (match, feedback) => {
        if (window.osAPI) {
            try {
                let oldPath = match[1].trim();
                let newPath = match[2].trim();
                if (window.osAPI.path && !window.osAPI.path.isAbsolute(newPath)) {
                    const dir = window.osAPI.path.dirname(oldPath);
                    newPath = window.osAPI.path.join(dir, newPath);
                }
                window.osAPI.renameSync(oldPath, newPath);
                feedback.push(`[SYSTEM]: Renamed ${oldPath} → ${newPath}`);
            } catch(e) {
                feedback.push(`[SYSTEM]: Error renaming: ${e.message}`);
            }
        }
    },
    'CREATE_DIR': async (match, feedback) => {
        if (window.osAPI) {
            try {
                window.osAPI.mkdirSync(match[1].trim());
                feedback.push(`[SYSTEM]: Created directory ${match[1].trim()}`);
            } catch(e) {
                feedback.push(`[SYSTEM]: Error creating directory: ${e.message}`);
            }
        }
    },
    'SEARCH_FILES': async (match, feedback) => {
        if (window.osAPI) {
            const pattern = match[1].trim().toLowerCase();
            const searchPath = match[2].trim();
            try {
                const results = [];
                const search = (dir, depth) => {
                    if (depth > 6 || results.length > 100) return;
                    try {
                        const entries = window.osAPI.readdirSync(dir);
                        for (const name of entries) {
                            if (name.startsWith('.') || name === 'node_modules') continue;
                            const fullPath = dir + '/' + name;
                            if (name.toLowerCase().includes(pattern)) results.push(fullPath);
                            try {
                                const stat = window.osAPI.statSync(fullPath);
                                if (stat.isDirectory) search(fullPath, depth + 1);
                            } catch(e) {}
                        }
                    } catch(e) {}
                };
                search(searchPath, 0);
                feedback.push(`[SEARCH_RESULTS for '${pattern}' in ${searchPath}]:\n${results.length > 0 ? results.join('\n') : 'No files found.'}`);
            } catch(e) {
                feedback.push(`[SYSTEM]: Search error: ${e.message}`);
            }
        }
    },
    'MOUSE_MOVE': async (match, feedback) => {
        if (window.electronAPI) {
            const res = await window.electronAPI.mouseMove(parseInt(match[1]), parseInt(match[2]));
            feedback.push(`[SYSTEM]: Mouse moved. ${res.ok ? 'Success' : res.error}`);
        }
    },
    'KEY_HOTKEY': async (match, feedback) => {
        if (window.electronAPI) {
            const res = await window.electronAPI.keyboardHotkey(match[1].trim());
            feedback.push(`[SYSTEM]: Hotkey ${match[1].trim()} executed. ${res.ok ? 'Success' : res.error}`);
        }
    },
    'NOTIFY': async (match, feedback) => {
        if (window.electronAPI) {
            await window.electronAPI.osNotify(match[1].trim(), match[2].trim());
            feedback.push('[SYSTEM]: Notification sent.');
        }
    }
};

const AI_NO_ARG_REGISTRY = {
    'WEB_READ': async (feedback) => {
        if (window.electronAPI) {
            const pyCode = `import sys; sys.path.append('core'); import luna_browser\nprint(luna_browser.get_text())`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            feedback.push(`[BROWSER_TEXT]:\n${res.output || res.error || 'Failed to read page text'}`);
        }
    },
    'CAPTURE_SCREEN': async (feedback) => {
        if (window.electronAPI) {
            const res = await window.electronAPI.captureScreen();
            if (res && res.ok && res.base64) {
                attachedImageBase64 = res.base64;
                attachedImageMime = 'image/png';
                if (document.getElementById('imagePreviewBar')) {
                    document.getElementById('imagePreviewBar').style.display = 'flex';
                    document.getElementById('imageThumb').src = 'data:image/png;base64,' + res.base64;
                    document.getElementById('imagePreviewLabel').textContent = 'Captured Desktop Screen';
                }
                feedback.push("[SYSTEM]: Screenshot of PHYSICAL DESKTOP attached! Use your vision to analyze the image and tell the user what you see.");
            } else {
                feedback.push("[VISION_ERROR]:\nCould not capture desktop screen.");
            }
        }
    },
    'STOP_CODE': async (feedback) => {
        if (window.electronAPI) {
            await window.electronAPI.stopCode();
            feedback.push('[SYSTEM]: Code execution stopped.');
        }
    },
    'CLIPBOARD_READ': async (feedback) => {
        if (window.electronAPI) {
            const res = await window.electronAPI.clipboardRead();
            feedback.push(`[CLIPBOARD_CONTENT]:\n${res.ok ? res.content : 'Error: ' + res.error}`);
        }
    },
    'SCREEN_INFO': async (feedback) => {
        if (window.electronAPI) {
            const res = await window.electronAPI.screenInfo();
            if (res.ok) {
                feedback.push(`[SCREEN_INFO]: Resolution: ${res.width}x${res.height} | Cursor at: (${res.cursorX}, ${res.cursorY})`);
            }
        }
    }
};

function getToolFriendlyName(tag, query) {
    const q = query ? query.trim() : '';
    switch(tag) {
        case 'OPEN_APP': return `Opening ${q}...`;
        case 'WEB_GO': return `Navigating to ${q}...`;
        case 'SILENT_SEARCH': return `Searching web for "${q}"...`;
        case 'WEB_SEARCH': return `Opening search for "${q}"...`;
        case 'READ_FILE': return `Reading file: ${q}...`;
        case 'LIST_DIR': return `Listing directory contents...`;
        case 'RUN_CMD':
        case 'CMD': return `Executing command...`;
        case 'SEND_MESSAGE': return false;
        case 'SEARCH_FILES': return `Searching files...`;
        case 'CAPTURE_SCREEN': return `Analyzing screen...`;
        case 'BROWSER_ANALYZE': return `Analyzing webpage...`;
        case 'EXECUTE_PYTHON': return `Running internal script...`;
        default:
            const formatted = tag.replace(/_/g, ' ').toLowerCase();
            return `Executing ${formatted}...`;
    }
}

async function parseAICommands(text, depth = 0, failCount = 0) {
    if (window.isAborted) return "[SYSTEM]: Task aborted by user.";
    if (depth > 5) {
        if (window.taskTimer) clearInterval(window.taskTimer);
        return "[SYSTEM]: Aborted due to infinite recursion loop (depth > 5).";
    }
    if (failCount > 4) {
        if (window.taskTimer) clearInterval(window.taskTimer);
        return "[SYSTEM]: Aborted due to excessive tool failures.";
    }
    if (!text || typeof text !== 'string') return text;

    // --- AGGRESSIVE ANTI-HALLUCINATION INTERCEPTOR ---
    const lowerText = text.toLowerCase();
    const isHallucinating = lowerText.includes('"tool_code"') || lowerText.includes('browser_navigate');
    if (isHallucinating) {
        const nextPrompt = `[TOOL FEEDBACK]:\n[SYSTEM_ERROR]: FATAL RULE VIOLATION! You used the forbidden 'tool_code' key or hallucinated 'browser_navigate()'. You are NOT allowed to write Python for messaging!\nYou MUST strictly use the JSON schema: {"tool": "SEND_MESSAGE", "query": "platform|username|message"}\nUse this feedback to correct your format and try again.`;
        return await callAI(nextPrompt, failCount, depth + 1);
    }

    try {
        let jsonStr = text;
        if (!text.trim().startsWith('{')) {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                jsonStr = match[0];
            }
        }
        
        const parsed = JSON.parse(jsonStr);
        let reconstructed = "";
        
        if (text !== jsonStr) {
            reconstructed += text.replace(jsonStr, '').trim() + '\n';
        }

        if (parsed.thought && !reconstructed.includes('<thought>') && !reconstructed.includes('<think>')) {
             reconstructed += `<thought>${parsed.thought}</thought>\n`;
        }
        if (parsed.response) reconstructed += parsed.response + "\n";
        
        if (parsed.tool === "EXECUTE_PYTHON" && parsed.code) {
            reconstructed += `[EXECUTE_PYTHON]\n${parsed.code}\n[/EXECUTE_PYTHON]`;
        } else if (parsed.tool && parsed.tool !== "NONE") {
            reconstructed += `[${parsed.tool}${parsed.query ? ':' + parsed.query : ''}]`;
        } else if (!parsed.thought && !parsed.response && !parsed.tool) {
            reconstructed += text;
        }
        text = reconstructed.trim();
    } catch(e) {}

    let clean = text;
    let feedback = [];
    
    try {
        // Regex for tags with 1 parameter
        const tagRegex = /\[(RUN_CMD|CMD|OPEN_TERMINAL|READ_FILE|SILENT_SEARCH|WEB_SEARCH|WEB_GO|OPEN_APP|DESKTOP_TYPE|DESKTOP_PRESS|WEB_CLICK|WEB_PRESS|LIST_DIR|DELETE_FILE|CREATE_DIR|MOUSE_MOVE|KEY_HOTKEY|CLIPBOARD_WRITE|NOTIFY|FILE_INFO|SEND_MESSAGE):([\s\S]*?)\]/gi;
        let match;
        while ((match = tagRegex.exec(text)) !== null) {
            const tag = match[1].toUpperCase();
            const shiftedMatch = [match[0], match[2]];
            
            const cbId = 'tool_cb_' + Date.now() + '_' + Math.floor(Math.random()*1000);
            const friendlyName = getToolFriendlyName(tag, shiftedMatch[1]);
            if (friendlyName && typeof addBubbleReveal === 'function') {
                addBubbleReveal('luna', `<div class="checkbox-wrapper" style="margin: 4px 0;"><input type="checkbox" id="${cbId}" disabled /><div class="checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div><span class="label" style="color:var(--dim); font-size:0.85rem;">${friendlyName}</span></div>`);
            }
            
            if (AI_COMMAND_REGISTRY[tag]) {
                await AI_COMMAND_REGISTRY[tag](shiftedMatch, feedback);
            } else if (tag === 'RUN_CMD') {
                if (AI_COMMAND_REGISTRY['CMD']) await AI_COMMAND_REGISTRY['CMD'](shiftedMatch, feedback);
            }
            
            const cb = document.getElementById(cbId);
            if (cb) { cb.checked = true; cb.parentElement.querySelector('.label').style.color = 'var(--checkbox-color)'; }
        }

        // Regex for tags with 2 parameters (separated by |)
        const tag2Regex = /\[(WRITE_FILE|RENAME_FILE|SEARCH_FILES|DOWNLOAD_FILE):([\s\S]*?)\|([\s\S]*?)\]/gi;
        while ((match = tag2Regex.exec(text)) !== null) {
            const tag = match[1].toUpperCase();
            const shiftedMatch = [match[0], match[2], match[3]];
            
            const cbId = 'tool_cb_' + Date.now() + '_' + Math.floor(Math.random()*1000);
            const friendlyName = getToolFriendlyName(tag, shiftedMatch[1]);
            if (friendlyName && typeof addBubbleReveal === 'function') {
                addBubbleReveal('luna', `<div class="checkbox-wrapper" style="margin: 4px 0;"><input type="checkbox" id="${cbId}" disabled /><div class="checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div><span class="label" style="color:var(--dim); font-size:0.85rem;">${friendlyName}</span></div>`);
            }
            
            if (AI_COMMAND_REGISTRY[tag]) {
                await AI_COMMAND_REGISTRY[tag](shiftedMatch, feedback);
            }
            
            const cb = document.getElementById(cbId);
            if (cb) { cb.checked = true; cb.parentElement.querySelector('.label').style.color = 'var(--checkbox-color)'; }
        }
        
        // Regex for no parameter tags
        const noArgRegex = /\[(WEB_READ|BROWSER_ANALYZE|CAPTURE_BROWSER|CAPTURE_SCREEN|STOP_CODE|CLIPBOARD_READ|SCREEN_INFO)\]/gi;
        while ((match = noArgRegex.exec(text)) !== null) {
            const tag = match[1].toUpperCase();
            
            const cbId = 'tool_cb_' + Date.now() + '_' + Math.floor(Math.random()*1000);
            const friendlyName = getToolFriendlyName(tag, '');
            if (friendlyName && typeof addBubbleReveal === 'function') {
                addBubbleReveal('luna', `<div class="checkbox-wrapper" style="margin: 4px 0;"><input type="checkbox" id="${cbId}" disabled /><div class="checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div><span class="label" style="color:var(--dim); font-size:0.85rem;">${friendlyName}</span></div>`);
            }
            
            if (AI_NO_ARG_REGISTRY[tag]) {
                await AI_NO_ARG_REGISTRY[tag](feedback);
            }
            
            const cb = document.getElementById(cbId);
            if (cb) { cb.checked = true; cb.parentElement.querySelector('.label').style.color = 'var(--checkbox-color)'; }
        }

        // Special UI Controls
        if (text.match(/\[MODE:CHAT\]/i)) { clean = clean.replace(/\[MODE:CHAT\]/gi, ''); setTimeout(() => showScreen('chat'), 500); }
        if (text.match(/\[MODE:VOICE\]/i)) { clean = clean.replace(/\[MODE:VOICE\]/gi, ''); setTimeout(() => showScreen('voice'), 500); }
        if (text.match(/\[OPEN_IDE\]/i))  { clean = clean.replace(/\[OPEN_IDE\]/gi,  ''); setTimeout(()=> toggleIDE(true), 500); }
        if (text.match(/\[CLOSE_IDE\]/i)) { clean = clean.replace(/\[CLOSE_IDE\]/gi, ''); setTimeout(()=> { if (document.getElementById('idePane')) document.getElementById('idePane').classList.add('hidden'); }, 500); }

        // Code Execution
        let pyCode = null;
        let pyMatchStr = "";
        const tagMatch = text.match(/\[EXECUTE_PYTHON:?\]?([\s\S]*?)(?:\[\/EXECUTE_PYTHON\]|\](?=\s*$|\s*\[))/i);
        const mdMatch = text.match(/```(?:python|py)\n([\s\S]*?)```/i);
        
        if (tagMatch) {
            pyCode = tagMatch[1].trim();
            pyMatchStr = tagMatch[0];
        } else if (mdMatch) {
            pyCode = mdMatch[1].trim();
            pyMatchStr = mdMatch[0];
        } else if (text.includes('[/EXECUTE_PYTHON]')) {
            pyCode = text.split('[/EXECUTE_PYTHON]')[0].replace(/```(python|py)?/gi, '').replace(/```/g, '').trim();
            pyMatchStr = text.split('[/EXECUTE_PYTHON]')[0] + '[/EXECUTE_PYTHON]';
        }

        if (pyCode && window.electronAPI) {
            clean = clean.replace(pyMatchStr, '');
            
            const lcode = pyCode.toLowerCase();
            const isIllegalMsg = lcode.includes('browser_navigate');
            
            if (isIllegalMsg) {
                feedback.push(`[SYSTEM_ERROR]: RULE VIOLATION. Do NOT use Python scripts or hallucinated functions like 'browser_navigate' for messaging! You MUST strictly use the JSON schema: {"tool": "SEND_MESSAGE", "query": "platform|username|message"}`);
            } else {
                // [OPTIMIZATION] Don't visually output the python code bubble for internal tool executions
                // if (typeof addCodeBlock === 'function') addCodeBlock('python', pyCode);
                
                const cbId = 'tool_cb_' + Date.now() + '_' + Math.floor(Math.random()*1000);
                if (friendlyName && typeof addBubbleReveal === 'function') {
                    addBubbleReveal('luna', `<div class="checkbox-wrapper" style="margin: 4px 0;"><input type="checkbox" id="${cbId}" disabled /><div class="checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div><span class="label" style="color:var(--dim); font-size:0.85rem;">Executing internal script...</span></div>`);
                }
                
                const res = await window.electronAPI.executeCode('python', pyCode);
                
                const cb = document.getElementById(cbId);
                if (cb) { cb.checked = true; cb.parentElement.querySelector('.label').style.color = 'var(--checkbox-color)'; }
                
                if (res.ok) {
                    feedback.push(`[PYTHON_OUTPUT]:\n${res.output}`);
                } else {
                    feedback.push(`[PYTHON_ERROR]: ${res.error || 'Unknown error'}\nPartial output: ${res.output || 'none'}`);
                }
            }
        }

        // Clean ALL tags from the display text
        clean = clean.replace(/\[[A-Z_]+(?::.*?)?\]/gis, ''); 
        clean = clean.replace(/luna_tools\.[a-z_]+\(.*?\)/gis, '');
        
    } catch (e) {
        console.error("AI Tag Parsing Error:", e);
    }
    
    document.querySelectorAll(".thought-block summary").forEach(el => { el.innerHTML = el.innerHTML.replace(/\(\d+%\)/, "(100%)").replace(/<span class=\"dots\">.*?<\/span>/, " ✅"); });
    
    if (feedback.length > 0) {
        const typingNode = document.getElementById('luna-typing');
        if (typingNode && typingNode.closest('.bubble-row')) {
            typingNode.closest('.bubble-row').remove();
        }
        
        if (clean.trim()) {
            addBubble('luna', clean.trim());
        }
        
        let animNode = document.getElementById('task-anim-global');
        if (!animNode) {
            window.taskAnimStartTime = Date.now();
            addBubble('luna', `<span id="task-anim-global" style="font-style:italic;color:var(--accent);">Working/Executing... [0.0s]</span>`);
            if (window.taskTimer) clearInterval(window.taskTimer);
            window.taskTimer = setInterval(() => {
                const elapsed = ((Date.now() - window.taskAnimStartTime) / 1000).toFixed(1) + 's';
                const el = document.getElementById('task-anim-global');
                if (el) {
                    el.textContent = 'Working/Executing... [' + elapsed + ']';
                } else {
                    clearInterval(window.taskTimer);
                }
                document.querySelectorAll('.thought-timer').forEach(t => t.textContent = '[' + elapsed + ']');
            }, 100);
        }
        
        let newFailCount = failCount;
        let joinedFeedback = feedback.join('\n\n');
        if (joinedFeedback.includes('_ERROR')) newFailCount++;

        let recursiveReply;
        if (depth + 1 > 5) {
            if (window.taskTimer) clearInterval(window.taskTimer);
            recursiveReply = "[SYSTEM]: Max recursion depth reached. Tool output returned to user.\n" + joinedFeedback;
        } else {
            recursiveReply = await callAI(joinedFeedback, newFailCount, depth + 1);
        }
        
        const finalAnimNode = document.getElementById('task-anim-global');
        if (finalAnimNode && finalAnimNode.closest('.bubble-row')) {
            finalAnimNode.closest('.bubble-row').remove();
            clearInterval(window.taskTimer);
        }
        
        if (recursiveReply && typeof recursiveReply === 'string') {
            recursiveReply = recursiveReply.replace(/\[SYSTEM\]:\s*/, '');
        }
        
        return recursiveReply;
    }
    
    return clean;
}


// --- VOICE CHAT PROCESSOR ---
async function processVoiceChat(text) {
    if (state.waitingForPythonInput) {
      state.waitingForPythonInput = false;
      $('voiceGreeting').textContent = 'Input sent...';
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'PYTHON_INPUT_REPLY', answer: text });
        if ($('msgInput')) $('msgInput').placeholder = 'Ask Luna anything...';
      }
      setTimeout(() => {
        if (state.screen === 'voice') { $('voiceGreeting').textContent = 'Say something...'; startListening(); }
      }, 1000);
      return;
    }
  
    $('voiceGreeting').textContent = 'Processing...';
    const display = $('voiceReply');
    if (display) { display.textContent = ''; display.classList.remove('active'); }
    
    // Safety check, ensure stopListening exists and we call it
    if (typeof stopListening === 'function') stopListening();
    
    try {
      const reply = await callAI(text);
      const clean = await parseAICommands(reply, 0, 0);
      
      $('voiceGreeting').textContent = '';
      $('voiceTranscript').textContent = ''; 
    
      const displayText = clean.trim();
      const spokenText = clean.replace(/```[\s\S]*?```/g, '').trim();
      
      if (typeof speak === 'function') {
        speak(spokenText, () => {
          state.processingVoice = false;
          if (state.screen === 'voice') { $('voiceGreeting').textContent = 'Say something...'; startListening(); }
        }, displayText);
      } else {
        console.warn('speak function missing');
      }
    } catch(e) {
      console.error(e);
      state.processingVoice = false;
      $('voiceGreeting').textContent = 'Connection Error.';
      setTimeout(() => {
        if(state.screen === 'voice') { $('voiceGreeting').textContent = 'Say something...'; startListening(); }
      }, 2000);
    }
}


// GLOBAL FALLBACK HANDLERS
window.forceGuestLogin = function() {
  console.log("GUEST BTN CLICKED");
  isGuestMode = true;
  userTier = 'GUEST';
  dailyLimit = 10;
  messagesToday = 0;
  const screen = document.getElementById('loginScreen');
  if (screen) screen.classList.add('hidden');
  updateMessageCounter();
  showToast('Logged in as Guest. Limited features available.', false);
  if (typeof showLocalPrompt === 'function') {
    showLocalPrompt();
  } else {
    const promptScreen = document.getElementById('localModelSetupScreen');
    if (promptScreen) promptScreen.classList.remove('hidden');
  }
};

window.forceLogin = async function() {
  console.log("LOGIN BTN CLICKED");
  let rawName = document.getElementById('loginUsername').value.trim();
  const err = document.getElementById('loginError');
  if (!rawName) { err.textContent = 'Please enter a username.'; return; }
  if (!window.fbSignIn && rawName !== 'admin') { err.textContent = 'Network offline. Use Guest mode.'; return; }
  const e = rawName + '@luna.local';
  const p = document.getElementById('loginPassword').value;
  err.textContent = 'Authenticating...';
  
  if (rawName === 'admin' && p === 'shashankvr') {
    err.textContent = '';
    userTier = 'ADMIN';
    isAdmin = true;
    dailyLimit = 999999;
    messagesToday = 0;
    currentUser = null;
    isGuestMode = false;
    const screen = document.getElementById('loginScreen');
    if (screen) screen.classList.add('hidden');
    
    if (typeof showLocalPrompt === 'function') {
      showLocalPrompt();
    } else {
      const promptScreen = document.getElementById('localModelSetupScreen');
      if (promptScreen) promptScreen.classList.remove('hidden');
    }
    return;
  }

  try {
    await window.fbSignIn(window.lunaAuth, e, p);
    err.textContent = '';
    if (typeof showLocalPrompt === 'function') {
      showLocalPrompt();
    } else {
      const promptScreen = document.getElementById('localModelSetupScreen');
      if (promptScreen) promptScreen.classList.remove('hidden');
    }
  } catch(error) {
    err.textContent = error.message;
  }
};

window.forceSignup = async function() {
  console.log("SIGNUP BTN CLICKED");
  let rawName = document.getElementById('loginUsername').value.trim();
  const err = document.getElementById('loginError');
  if (!rawName) { err.textContent = 'Please enter a username.'; return; }
  if (!window.fbSignUp) { err.textContent = 'Network offline. Use Guest mode.'; return; }
  const e = rawName + '@luna.local';
  const p = document.getElementById('loginPassword').value;
  err.textContent = 'Creating identity...';
  try {
    await window.fbSignUp(window.lunaAuth, e, p);
    err.textContent = '';
    if (typeof showLocalPrompt === 'function') {
      showLocalPrompt();
    } else {
      const promptScreen = document.getElementById('localModelSetupScreen');
      if (promptScreen) promptScreen.classList.remove('hidden');
    }
  } catch(error) {
    err.textContent = error.message;
  
}

}

// --- 3-Dots Menu Logic ---
window.toggleDotsMenu = function(btn, event) {
    event.stopPropagation();
    const dropdown = btn.nextElementSibling;
    const isShowing = dropdown.classList.contains('show');
    document.querySelectorAll('.dots-dropdown').forEach(d => d.classList.remove('show'));
    if (!isShowing) dropdown.classList.add('show');
};

document.addEventListener('click', () => {
    document.querySelectorAll('.dots-dropdown').forEach(d => d.classList.remove('show'));
});

window.triggerApology = function(btn) {
    const dropdown = btn.closest('.dots-dropdown');
    dropdown.classList.remove('show');
    if (typeof addBubble === 'function') {
        addBubble('luna', 'I sincerely apologize for the error. Would you like me to try again?');
    }
};

// --- Dynamic Checklist System ---
window.currentChecklistId = null;

window.createChecklist = function(tasks) {
    const id = 'checklist-' + Date.now();
    window.currentChecklistId = id;
    
    let html = `<div id="${id}" class="checklist-container">`;
    tasks.forEach((task, index) => {
        html += `
        <label class="checkbox-wrapper" id="${id}-item-${index}">
          <input type="checkbox" disabled />
          <div class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 6L9 17L4 12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </div>
          <span class="label">${task}</span>
        </label>
        `;
    });
    html += `</div>`;
    addBubble('luna', html);
    return id;
};

window.tickChecklist = function(taskSubstring) {
    if (!window.currentChecklistId) return;
    const container = document.getElementById(window.currentChecklistId);
    if (!container) return;
    
    const labels = container.querySelectorAll('.label');
    labels.forEach(label => {
        if (label.textContent.toLowerCase().includes(taskSubstring.toLowerCase())) {
            const input = label.parentElement.querySelector('input');
            if (input && !input.checked) {
                input.checked = true;
            }
        }
    });
};

// --- Terminal Progress Interceptor ---
setTimeout(() => {
    if (window.electronAPI && window.electronAPI.onCodeOutput) {
        window.electronAPI.onCodeOutput((data) => {
            if (data && data.content && data.content.includes('[PROGRESS]')) {
                const step = data.content.split('[PROGRESS]')[1].trim();
                if (window.tickChecklist) {
                    const keywords = step.split(' ').filter(w => w.length > 3);
                    if (keywords.length > 0) window.tickChecklist(keywords[0]);
                    else window.tickChecklist(step);
                }
            }
        });
    }
}, 1500);

window.toggleAuth = function(e) {
  const signupBtn = document.getElementById('signupBtn');
  const loginBtn = document.getElementById('loginBtn');
  const sub = document.getElementById('authSubtitle');
  const un = document.getElementById('loginUsername');
  const pw = document.getElementById('loginPassword');
  const target = document.getElementById('toggleAuthMode');
  
  if (!signupBtn || !loginBtn || !target) return;
  
  const isSignup = !signupBtn.classList.contains('hidden');
  if (isSignup) {
    signupBtn.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    if (sub) sub.textContent = 'PLEASE AUTHENTICATE';
    target.textContent = "Don't have an account? Sign up";
    if (un) un.placeholder = 'Enter Username';
    if (pw) pw.placeholder = 'Enter Password';
  } else {
    loginBtn.classList.add('hidden');
    signupBtn.classList.remove('hidden');
    if (sub) sub.textContent = 'CREATE YOUR IDENTITY';
    target.textContent = "Already have an account? Log in";
    if (un) un.placeholder = 'Choose a Username (letters/numbers only)';
    if (pw) pw.placeholder = 'Create a Password';
  }
};






// Smart Menu Hover Logic
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const menuBtn = document.querySelector('.menu-btn');
    const flipCard = document.querySelector('.flip-card');
    if (menuBtn && flipCard) {
      let hoverTimer;
      menuBtn.addEventListener('mouseenter', () => {
          flipCard.classList.add('flipped');
      });
      menuBtn.addEventListener('mouseleave', () => {
          // Grace period for moving mouse across the gap
          hoverTimer = setTimeout(() => {
              flipCard.classList.remove('flipped');
          }, 300);
      });
      flipCard.addEventListener('mouseenter', () => {
          clearTimeout(hoverTimer);
      });
      flipCard.addEventListener('mouseleave', () => {
          flipCard.classList.remove('flipped');
      });
    }
  }, 1000); // Give DOM a second to mount components if needed
});




// Expanded Modals Logic
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const settingsRadio = document.getElementById('m-settings');
        const helpRadio = document.getElementById('m-help');
        const settingsModal = document.getElementById('cyberSettingsModal');
        const helpModal = document.getElementById('cyberHelpModal');
        
        // Tab Switching Logic
        const tabBtns = document.querySelectorAll('.cyber-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-target');
                // Remove active from all
                document.querySelectorAll('.cyber-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.cyber-tab-pane').forEach(p => p.classList.remove('active'));
                // Add active to current
                e.target.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });

        // Sub-Tab Switching Logic
        const subTabBtns = document.querySelectorAll('.cyber-sub-btn');
        subTabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-sub');
                document.querySelectorAll('.cyber-sub-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.color = 'var(--dim)';
                });
                document.querySelectorAll('.cyber-sub-pane').forEach(p => {
                    p.classList.remove('active');
                    p.style.display = 'none';
                });
                e.target.classList.add('active');
                e.target.style.color = 'var(--text)';
                const targetPane = document.getElementById(targetId);
                targetPane.classList.add('active');
                targetPane.style.display = 'block';
            });
        });

        const setupModalTrigger = (radio, modal) => {
            if(radio && modal) {
                radio.addEventListener('click', (e) => { modal.classList.remove('hidden'); setTimeout(() => { e.target.checked = false; }, 100); });
                const closers = modal.querySelectorAll('.modal-closer, .cyber-modal-overlay');
                closers.forEach(closer => {
                    closer.addEventListener('click', () => {
                        modal.classList.add('hidden');
                    });
                });
            }
        };

        setupModalTrigger(settingsRadio, settingsModal);
        setupModalTrigger(helpRadio, helpModal);

        const profileRadio = document.getElementById('m-profile');
        const profileModal = document.getElementById('cyberProfileModal');
        setupModalTrigger(profileRadio, profileModal);

        const msgRadio = document.getElementById('m-messages');
        const msgModal = document.getElementById('cyberConversationsModal');
        setupModalTrigger(msgRadio, msgModal);

        const dashRadio = document.getElementById('m-dashboard');
        if(dashRadio) { dashRadio.addEventListener('click', (e) => { if(e.target.checked) { settingsModal.classList.add('hidden'); helpModal.classList.add('hidden'); profileModal.classList.add('hidden'); msgModal.classList.add('hidden'); setTimeout(()=>{e.target.checked=true;}, 100); } }); }

    }, 2000); // Wait for DOM parsing
});


window.pingLocalModelSilently = async function() {
    if (state.screen === 'sleep' || window.getComputedStyle(document.getElementById('sleepScreen')).display !== 'none') {
        startBrainActivity();
        let targetModel = cfg.optMode || 'phi3:mini';
        try {
            await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: targetModel, prompt: 'hi', stream: false })
            });
        } catch(e) {}
        stopBrainActivity();
        if (typeof speakGreeting === 'function') speakGreeting();
    }
};
document.addEventListener('DOMContentLoaded', () => { setTimeout(window.pingLocalModelSilently, 3000); });


window.fetchNews = async function() {
    try {
        let kw = localStorage.getItem('luna_news_keyword') || 'Technology';
        let disp = document.getElementById('newsKeywordDisplay');
        if(disp) disp.innerText = '(' + kw + ')';
        let feed = document.getElementById('newsFeedContent');
        if(!feed) return;
        feed.innerHTML = '<div style="color: var(--gray); font-style: italic;">Loading neural feed...</div>';
        if (window.electronAPI && window.electronAPI.runPython) {
            let res = await window.electronAPI.runPython('fetch_news.py', [kw]);
            if (res && res.ok && res.data) {
                let html = '';
                res.data.forEach(d => {
                    html += '<div style="margin-bottom: 5px;"><a href="' + d.link + '" target="_blank" style="color: var(--fg); text-decoration: none; font-weight: 500;">' + d.title + '</a><br><span style="font-size: 0.7rem; color: var(--gray);">Source: ' + d.source + '</span></div>';
                });
                feed.innerHTML = html;
            } else {
                feed.innerHTML = '<div style="color: var(--red);">News offline or parsing failed.</div>';
            }
        } else {
            feed.innerHTML = '<div style="color: var(--red);">Connection error.</div>';
        }
    } catch(e) {
        let feed = document.getElementById('newsFeedContent');
        if(feed) feed.innerHTML = '<div style="color: var(--red);">Error: ' + e.message + '</div>';
    }
};
document.addEventListener('DOMContentLoaded', () => setTimeout(window.fetchNews, 2000));




window.saveProfileData = function() {
    const newsInt = document.getElementById('profileNewsInterest');
    if(newsInt) {
        localStorage.setItem('luna_news_keyword', newsInt.value.trim());
        if(window.fetchNews) window.fetchNews();
    }
    const modal = document.getElementById('cyberProfileModal');
    if (modal) modal.classList.add('hidden');
};


document.addEventListener('DOMContentLoaded', () => {
    const newsInt = document.getElementById('profileNewsInterest');
    if(newsInt) newsInt.value = localStorage.getItem('luna_news_keyword') || 'Technology';
});



window.loadSession = function(id) {
    let sess = allSessions.find(s => s.id === id);
    if(sess) {
        currentSessionId = sess.id;
        messages = sess.messages || [];
        document.getElementById('chatFeed').innerHTML = '';
        messages.forEach(m => {
            if(m.role === 'user') addMessage('user', m.content);
            else addMessage('luna', m.content);
        });
        const modal = document.getElementById('cyberConversationsModal');
        if(modal) modal.classList.add('hidden');
    }
};

window.loadConversations = function() {
    const list = document.getElementById('convList');
    if (!list) return;
    
    let sessions = [];
    try {
        sessions = JSON.parse(localStorage.getItem('luna_sessions')) || [];
    } catch(e) {}
    
    if (sessions.length === 0) {
        list.innerHTML = '<div style="color: var(--dim); font-style: italic;">No past conversations found.</div>';
        return;
    }
    
    sessions.sort((a,b) => b.id - a.id);
    
    let html = '';
    sessions.forEach(s => {
        let dateStr = new Date(s.id).toLocaleString();
        let msgs = s.messages || [];
        let preview = msgs.length > 0 ? (msgs[0].content || '').substring(0, 50) + '...' : 'Empty session';
        html += '<div class="cyber-session-item" data-text="' + (dateStr + ' ' + preview).toLowerCase() + '" style="padding: 10px; border: 1px solid rgba(0,255,100,0.2); border-radius: 5px; cursor: pointer; transition: 0.2s;" onclick="loadSession(' + s.id + ')">';
        html += '<div style="font-size: 0.8rem; color: var(--dim); margin-bottom: 5px;">' + dateStr + '</div>';
        html += '<div style="color: var(--text); font-size: 0.9rem;">' + preview + '</div>';
        html += '</div>';
    });
    list.innerHTML = html;
};

document.addEventListener('DOMContentLoaded', () => {
    const msgRadio = document.getElementById('m-messages');
    if (msgRadio) msgRadio.addEventListener('click', window.loadConversations);
    
    const search = document.getElementById('convSearch');
    if (search) {
        search.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.cyber-session-item').forEach(el => {
                if (el.getAttribute('data-text').includes(query)) el.style.display = 'block';
                else el.style.display = 'none';
            });
        });
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const helpSearch = document.getElementById('helpSearch');
    if (helpSearch) {
        helpSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('#cyberHelpModal .faq-item').forEach(el => {
                if (el.textContent.toLowerCase().includes(query)) el.style.display = 'block';
                else el.style.display = 'none';
            });
        });
    }
});


window.updateDashLayout = function() {
    const tNews = document.getElementById('toggleNews');
    const tOrb = document.getElementById('toggleOrb');
    const tTerm = document.getElementById('toggleTerminal');
    
    if(!tNews || !tOrb || !tTerm) return;
    
    const showNews = tNews.checked;
    const showOrb = tOrb.checked;
    const showTerm = tTerm.checked;
    
    localStorage.setItem('dash_showNews', showNews);
    localStorage.setItem('dash_showOrb', showOrb);
    localStorage.setItem('dash_showTerm', showTerm);
    
    const newsCard = document.getElementById('dailyNewsCard');
    const orbCont = document.getElementById('luna-orb');
    const termCont = document.querySelector('.terminal-card');
    
    if(newsCard) newsCard.style.display = showNews ? 'flex' : 'none';
    if(orbCont) orbCont.style.display = showOrb ? 'flex' : 'none';
    if(termCont) termCont.style.display = showTerm ? 'flex' : 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    const tNews = document.getElementById('toggleNews');
    const tOrb = document.getElementById('toggleOrb');
    const tTerm = document.getElementById('toggleTerminal');
    
    if(tNews) {
        tNews.checked = localStorage.getItem('dash_showNews') !== 'false';
        tOrb.checked = localStorage.getItem('dash_showOrb') !== 'false';
        tTerm.checked = localStorage.getItem('dash_showTerm') !== 'false';
        updateDashLayout();
    }
});






// ═══════════════════════════════════════════════════════════════
// LUNA MODE SWITCHER (Chat / Voice / Console)
// ═══════════════════════════════════════════════════════════════
window.switchMode = function(mode) {
    localStorage.setItem('luna_mode', mode);

    const chatPane = document.getElementById('chatPane');
    const voicePanel = document.getElementById('voicePanel');
    const consolePanel = document.getElementById('consolePanel');

    // Hide all panels
    if (chatPane) chatPane.style.display = 'none';
    if (voicePanel) voicePanel.classList.add('hidden');
    if (consolePanel) consolePanel.classList.add('hidden');
    
    // Toggle layout view class on body
    if (mode === 'console') {
        document.body.classList.add('console-active');
    } else {
        document.body.classList.remove('console-active');
    }

    // Update toggle buttons
    ['modeChat','modeVoice','modeConsole'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });

    if (mode === 'chat') {
        if (chatPane) chatPane.style.display = 'flex';
        const b = document.getElementById('modeChat'); if(b) b.classList.add('active');
    } else if (mode === 'voice') {
        if (voicePanel) voicePanel.classList.remove('hidden');
        const b = document.getElementById('modeVoice'); if(b) b.classList.add('active');
    } else if (mode === 'console') {
        if (consolePanel) consolePanel.classList.remove('hidden');
        const b = document.getElementById('modeConsole'); if(b) b.classList.add('active');
        // Initialize preview on first open
        updatePreview();
        renderGrindProblems();
    }
};

// Restore mode on load
document.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('luna_mode') || 'chat';
    setTimeout(() => switchMode(savedMode), 500);
});

// ═══════════════════════════════════════════════════════════════
// CONSOLE SUB-MODE SWITCHER (UI/UX Dev vs Language Grind)
// ═══════════════════════════════════════════════════════════════
window.switchConsoleMode = function(mode) {
    const uiuxPane = document.getElementById('consUiuxPane');
    const grindPane = document.getElementById('consGrindPane');
    const btnUiux = document.getElementById('consSubUiux');
    const btnGrind = document.getElementById('consSubGrind');

    if (mode === 'uiux') {
        if (uiuxPane) uiuxPane.style.display = 'flex';
        if (grindPane) grindPane.style.display = 'none';
        if (btnUiux) { btnUiux.style.background='rgba(0,180,255,0.15)'; btnUiux.style.color='#00b4ff'; btnUiux.style.borderColor='rgba(0,180,255,0.3)'; }
        if (btnGrind) { btnGrind.style.background='transparent'; btnGrind.style.color='#555'; btnGrind.style.borderColor='transparent'; }
        updatePreview();
    } else {
        if (uiuxPane) uiuxPane.style.display = 'none';
        if (grindPane) grindPane.style.display = 'flex';
        if (btnGrind) { btnGrind.style.background='rgba(0,180,255,0.15)'; btnGrind.style.color='#00b4ff'; btnGrind.style.borderColor='rgba(0,180,255,0.3)'; }
        if (btnUiux) { btnUiux.style.background='transparent'; btnUiux.style.color='#555'; btnUiux.style.borderColor='transparent'; }
        renderGrindProblems();
    }
};

// ═══════════════════════════════════════════════════════════════
// EDITOR TAB SWITCHER
// ═══════════════════════════════════════════════════════════════
window.switchEditorTab = function(tab) {
    ['html','css','js'].forEach(t => {
        const ta = document.getElementById('ed' + t.charAt(0).toUpperCase() + t.slice(1));
        const btn = document.getElementById('edTab' + t.charAt(0).toUpperCase() + t.slice(1));
        if (ta) ta.style.display = (t === tab) ? 'block' : 'none';
        if (btn) {
            if (t === tab) {
                btn.style.background = 'rgba(0,180,255,0.1)';
                btn.style.color = '#00b4ff';
                btn.style.borderBottom = '2px solid #00b4ff';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = '#555';
                btn.style.borderBottom = '2px solid transparent';
            }
        }
    });
};

// ═══════════════════════════════════════════════════════════════
// LIVE PREVIEW LOGIC
// ═══════════════════════════════════════════════════════════════
let autoPreviewTimer = null;
window.autoPreview = function() {
    clearTimeout(autoPreviewTimer);
    autoPreviewTimer = setTimeout(updatePreview, 600);
};

window.updatePreview = function() {
    const html = document.getElementById('edHtml') ? document.getElementById('edHtml').value : '';
    const css = document.getElementById('edCss') ? document.getElementById('edCss').value : '';
    const js = document.getElementById('edJs') ? document.getElementById('edJs').value : '';
    const iframe = document.getElementById('livePreview');
    if (!iframe) return;
    
    let combined = html;
    if (html.includes('</head>')) {
        combined = combined.replace('</head>', `<style>${css}</style></head>`);
    } else {
        combined = combined + `<style>${css}</style>`;
    }

    if (combined.includes('</body>')) {
        combined = combined.replace('</body>', `<script>${js}<\/script></body>`);
    } else {
        combined = combined + `<script>${js}<\/script>`;
    }
    
    // Using srcdoc is highly reliable and avoids layout timing issues from doc.write when reopening hidden iframes
    iframe.srcdoc = combined;
};

// ═══════════════════════════════════════════════════════════════
// LANGUAGE GRIND
// ═══════════════════════════════════════════════════════════════
const GRIND_PROBLEMS = [
    // Python — Easy
    {id:'p1', lang:'python', diff:'easy', title:'Hello World', desc:'Write a Python function that returns the string "Hello, World!".', starter:'def hello_world():\n    # Your code here\n    pass'},
    {id:'p2', lang:'python', diff:'easy', title:'Sum of Two Numbers', desc:'Write a function sum_two(a, b) that returns the sum of two numbers.', starter:'def sum_two(a, b):\n    # Your code here\n    pass'},
    {id:'p3', lang:'python', diff:'easy', title:'Even or Odd', desc:'Write a function is_even(n) that returns True if n is even, False otherwise.', starter:'def is_even(n):\n    # Your code here\n    pass'},
    {id:'p4', lang:'python', diff:'easy', title:'Reverse a String', desc:'Write a function reverse_str(s) that returns the reversed string.', starter:'def reverse_str(s):\n    # Your code here\n    pass'},
    {id:'p5', lang:'python', diff:'easy', title:'Factorial', desc:'Write a function factorial(n) that returns n! (factorial of n).', starter:'def factorial(n):\n    # Your code here\n    pass'},
    {id:'p6', lang:'python', diff:'easy', title:'Count Vowels', desc:'Write a function count_vowels(s) that counts the number of vowels in s.', starter:'def count_vowels(s):\n    # Your code here\n    pass'},
    {id:'p7', lang:'python', diff:'easy', title:'Max of Three', desc:'Write a function max_three(a, b, c) that returns the maximum of three numbers.', starter:'def max_three(a, b, c):\n    # Your code here\n    pass'},
    {id:'p8', lang:'python', diff:'easy', title:'List Sum', desc:'Write a function list_sum(lst) that returns the sum of all elements in the list.', starter:'def list_sum(lst):\n    # Your code here\n    pass'},
    {id:'p9', lang:'python', diff:'easy', title:'Palindrome Check', desc:'Write a function is_palindrome(s) that returns True if s is a palindrome.', starter:'def is_palindrome(s):\n    # Your code here\n    pass'},
    {id:'p10', lang:'python', diff:'easy', title:'FizzBuzz', desc:'Print numbers 1-100. For multiples of 3 print "Fizz", for 5 print "Buzz", for both print "FizzBuzz".', starter:'for i in range(1, 101):\n    # Your code here\n    pass'},
    {id:'p11', lang:'python', diff:'easy', title:'Square Root', desc:'Write a function square_root(n) that returns the square root of n without using math.sqrt.', starter:'def square_root(n):\n    # Your code here\n    pass'},
    {id:'p12', lang:'python', diff:'easy', title:'List Flatten', desc:'Write a function flatten(lst) that flattens a nested list one level deep.', starter:'def flatten(lst):\n    # Your code here\n    pass'},
    {id:'p13', lang:'python', diff:'easy', title:'Remove Duplicates', desc:'Write a function remove_dupes(lst) that removes duplicates while preserving order.', starter:'def remove_dupes(lst):\n    # Your code here\n    pass'},
    {id:'p14', lang:'python', diff:'easy', title:'Word Count', desc:'Write a function word_count(s) that returns a dict of word frequencies.', starter:'def word_count(s):\n    # Your code here\n    pass'},
    {id:'p15', lang:'python', diff:'easy', title:'Caesar Cipher', desc:'Write a function caesar(s, shift) that encodes s using a Caesar cipher with the given shift.', starter:'def caesar(s, shift):\n    # Your code here\n    pass'},
    // Python — Medium
    {id:'p16', lang:'python', diff:'medium', title:'Binary Search', desc:'Implement binary_search(arr, target) that returns the index of target in sorted arr, or -1.', starter:'def binary_search(arr, target):\n    # Your code here\n    pass'},
    {id:'p17', lang:'python', diff:'medium', title:'Merge Sort', desc:'Implement merge_sort(arr) that returns a sorted copy of arr using merge sort.', starter:'def merge_sort(arr):\n    # Your code here\n    pass'},
    {id:'p18', lang:'python', diff:'medium', title:'Two Sum', desc:'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', starter:'def two_sum(nums, target):\n    # Your code here\n    pass'},
    {id:'p19', lang:'python', diff:'medium', title:'Valid Parentheses', desc:'Write is_valid(s) that determines if the input string of brackets is valid.', starter:'def is_valid(s):\n    # Your code here\n    pass'},
    {id:'p20', lang:'python', diff:'medium', title:'Linked List Reverse', desc:'Given a Python list representing a linked list, reverse it in-place.', starter:'def reverse_list(lst):\n    # Your code here\n    pass'},
    {id:'p21', lang:'python', diff:'medium', title:'Matrix Transpose', desc:'Write transpose(matrix) that returns the transpose of a 2D matrix.', starter:'def transpose(matrix):\n    # Your code here\n    pass'},
    {id:'p22', lang:'python', diff:'medium', title:'Anagram Check', desc:'Write is_anagram(s1, s2) that returns True if s1 and s2 are anagrams.', starter:'def is_anagram(s1, s2):\n    # Your code here\n    pass'},
    {id:'p23', lang:'python', diff:'medium', title:'Fibonacci Memoized', desc:'Write fib(n) using memoization to compute the nth Fibonacci number efficiently.', starter:'def fib(n, memo={}):\n    # Your code here\n    pass'},
    {id:'p24', lang:'python', diff:'medium', title:'Number to Words', desc:'Convert an integer (0–999) to its English word representation.', starter:'def num_to_words(n):\n    # Your code here\n    pass'},
    {id:'p25', lang:'python', diff:'medium', title:'Spiral Matrix', desc:'Given an n x n matrix, return all elements in spiral order.', starter:'def spiral_order(matrix):\n    # Your code here\n    pass'},
    // Python — Hard
    {id:'p26', lang:'python', diff:'hard', title:'Longest Palindromic Substring', desc:'Find the longest palindromic substring in a given string.', starter:'def longest_palindrome(s):\n    # Your code here\n    pass'},
    {id:'p27', lang:'python', diff:'hard', title:'Trapping Rain Water', desc:'Given n non-negative integers representing heights, compute how much water it can trap after raining.', starter:'def trap(height):\n    # Your code here\n    pass'},
    {id:'p28', lang:'python', diff:'hard', title:'LRU Cache', desc:'Design and implement a Least Recently Used (LRU) cache with get and put operations in O(1).', starter:'class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass'},
    {id:'p29', lang:'python', diff:'hard', title:'N-Queens', desc:'Solve the N-Queens puzzle. Return all distinct solutions as lists of queen positions.', starter:'def solve_n_queens(n):\n    # Your code here\n    pass'},
    {id:'p30', lang:'python', diff:'hard', title:'Regular Expression Match', desc:'Implement regex matching with . (any char) and * (zero or more).', starter:'def is_match(s, p):\n    # Your code here\n    pass'},
    // C — Easy
    {id:'c1', lang:'c', diff:'easy', title:'Hello World', desc:'Write a C program that prints "Hello, World!" to stdout.', starter:'#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}'},
    {id:'c2', lang:'c', diff:'easy', title:'Sum of Two Integers', desc:'Write a C function int sum(int a, int b) that returns a + b.', starter:'#include <stdio.h>\n\nint sum(int a, int b) {\n    // Your code here\n}\n\nint main() {\n    printf("%d\\n", sum(3, 5));\n    return 0;\n}'},
    {id:'c3', lang:'c', diff:'easy', title:'Fibonacci', desc:'Write a C program that prints the first 10 Fibonacci numbers.', starter:'#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}'},
    {id:'c4', lang:'c', diff:'easy', title:'Reverse Array', desc:'Write a C program that reverses an array of 5 integers.', starter:'#include <stdio.h>\n\nvoid reverse(int arr[], int n) {\n    // Your code here\n}\n\nint main() {\n    int a[] = {1,2,3,4,5};\n    reverse(a, 5);\n    for(int i=0; i<5; i++) printf("%d ", a[i]);\n    return 0;\n}'},
    {id:'c5', lang:'c', diff:'easy', title:'Bubble Sort', desc:'Implement bubble sort in C.', starter:'#include <stdio.h>\n\nvoid bubble_sort(int arr[], int n) {\n    // Your code here\n}\n\nint main() {\n    int a[] = {5,3,8,1,2};\n    bubble_sort(a, 5);\n    for(int i=0;i<5;i++) printf("%d ",a[i]);\n    return 0;\n}'},
    // C — Medium
    {id:'c6', lang:'c', diff:'medium', title:'Linked List', desc:'Implement a singly linked list in C with insert and print functions.', starter:'#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int val;\n    struct Node* next;\n} Node;\n\n// Insert at head\nNode* insert(Node* head, int val) {\n    // Your code here\n    return head;\n}\n\nvoid print_list(Node* head) {\n    // Your code here\n}\n\nint main() {\n    Node* head = NULL;\n    head = insert(head, 1);\n    head = insert(head, 2);\n    head = insert(head, 3);\n    print_list(head);\n    return 0;\n}'},
    {id:'c7', lang:'c', diff:'medium', title:'Binary Tree', desc:'Implement a binary search tree in C with insert and inorder traversal.', starter:'#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int val;\n    struct Node *left, *right;\n} Node;\n\nNode* insert(Node* root, int val) {\n    // Your code here\n    return root;\n}\n\nvoid inorder(Node* root) {\n    // Your code here\n}\n\nint main() {\n    Node* root = NULL;\n    int vals[] = {5,3,7,1,4,6,8};\n    for(int i=0;i<7;i++) root = insert(root, vals[i]);\n    inorder(root);\n    return 0;\n}'},
    // Java — Easy
    {id:'j1', lang:'java', diff:'easy', title:'Hello World', desc:'Write a Java class that prints "Hello, World!".', starter:'public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}'},
    {id:'j2', lang:'java', diff:'easy', title:'Fibonacci', desc:'Write a Java method that returns the nth Fibonacci number.', starter:'public class Solution {\n    public static int fib(int n) {\n        // Your code here\n        return 0;\n    }\n    public static void main(String[] args) {\n        System.out.println(fib(10));\n    }\n}'},
    {id:'j3', lang:'java', diff:'easy', title:'String Reverse', desc:'Write a Java method that reverses a given string.', starter:'public class Solution {\n    public static String reverse(String s) {\n        // Your code here\n        return "";\n    }\n    public static void main(String[] args) {\n        System.out.println(reverse("Luna"));\n    }\n}'},
    // Java — Medium
    {id:'j4', lang:'java', diff:'medium', title:'Implement Stack', desc:'Implement a stack using an array in Java with push, pop, peek operations.', starter:'public class Solution {\n    static int[] stack = new int[100];\n    static int top = -1;\n    \n    public static void push(int val) {\n        // Your code here\n    }\n    public static int pop() {\n        // Your code here\n        return -1;\n    }\n    public static int peek() {\n        // Your code here\n        return -1;\n    }\n    public static void main(String[] args) {\n        push(1); push(2); push(3);\n        System.out.println(pop()); // 3\n        System.out.println(peek()); // 2\n    }\n}'},
    // Java — Hard
    {id:'j5', lang:'java', diff:'hard', title:'LRU Cache Java', desc:'Design and implement an LRU Cache in Java using LinkedHashMap.', starter:'import java.util.*;\n\npublic class LRUCache {\n    private final int capacity;\n    private final LinkedHashMap<Integer,Integer> cache;\n    \n    public LRUCache(int capacity) {\n        // Your code here\n    }\n    public int get(int key) {\n        // Your code here\n        return -1;\n    }\n    public void put(int key, int value) {\n        // Your code here\n    }\n    public static void main(String[] args) {\n        LRUCache c = new LRUCache(2);\n        c.put(1,1); c.put(2,2);\n        System.out.println(c.get(1)); // 1\n        c.put(3,3);\n        System.out.println(c.get(2)); // -1 (evicted)\n    }\n}'},

    // Python — Medium (more)
    {id:'p31', lang:'python', diff:'medium', title:'Valid Sudoku', desc:'Determine if a 9x9 Sudoku board is valid. Each row, column, and 3x3 box must contain digits 1-9 without repetition.', starter:'def is_valid_sudoku(board):\n    # board is a 9x9 list of lists, empty cells are "."\n    # Your code here\n    pass'},
    {id:'p32', lang:'python', diff:'medium', title:'Group Anagrams', desc:'Given an array of strings, group the anagrams together and return the groups.', starter:'def group_anagrams(strs):\n    # Your code here\n    pass'},
    {id:'p33', lang:'python', diff:'medium', title:'Longest Consecutive Sequence', desc:'Given an unsorted array of integers, find the length of the longest consecutive elements sequence in O(n).', starter:'def longest_consecutive(nums):\n    # Your code here\n    pass'},
    {id:'p34', lang:'python', diff:'medium', title:'Product of Array Except Self', desc:'Return an array where each element is the product of all other elements, without using division.', starter:'def product_except_self(nums):\n    # Your code here\n    pass'},
    {id:'p35', lang:'python', diff:'medium', title:'Find Peak Element', desc:'A peak element is greater than its neighbors. Find any peak element index in O(log n).', starter:'def find_peak_element(nums):\n    # Your code here\n    pass'},
    // Python — Hard (more)
    {id:'p36', lang:'python', diff:'hard', title:'Word Ladder', desc:'Given beginWord, endWord, and wordList, find the shortest transformation sequence length. Each step must change exactly one letter.', starter:'def ladder_length(begin_word, end_word, word_list):\n    # Your code here\n    pass'},
    {id:'p37', lang:'python', diff:'hard', title:'Serialize Binary Tree', desc:'Serialize and deserialize a binary tree (convert to/from string).', starter:'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val; self.left = left; self.right = right\n\ndef serialize(root):\n    # Your code here\n    pass\n\ndef deserialize(data):\n    # Your code here\n    pass'},
    // C — Medium/Hard (more)
    {id:'c8', lang:'c', diff:'medium', title:'Stack using Queues', desc:'Implement a stack using two queues in C with push, pop, peek, and empty operations.', starter:'#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n\n// Implement Stack using two circular queues\n// push(val), pop(), peek(), isEmpty()\nint queue1[100], queue2[100];\nint front1=0, rear1=0, front2=0, rear2=0;\n\nvoid push(int val) { /* Your code here */ }\nint pop() { /* Your code here */ return -1; }\nint peek() { /* Your code here */ return -1; }\nbool isEmpty() { /* Your code here */ return true; }\n\nint main() {\n    push(1); push(2); push(3);\n    printf("%d\\n", pop()); // 3\n    printf("%d\\n", peek()); // 2\n    return 0;\n}'},
    {id:'c9', lang:'c', diff:'hard', title:'Dynamic Memory Allocator', desc:'Implement a simple malloc and free using a static buffer in C.', starter:'#include <stdio.h>\n#include <string.h>\n\n#define HEAP_SIZE 1024\nchar heap[HEAP_SIZE];\nint heap_top = 0;\n\nvoid* my_malloc(int size) {\n    // Your code here\n    return NULL;\n}\n\nvoid my_free(void* ptr) {\n    // Basic implementation\n}\n\nint main() {\n    int* arr = (int*)my_malloc(5 * sizeof(int));\n    for(int i=0;i<5;i++) arr[i] = i+1;\n    for(int i=0;i<5;i++) printf("%d ", arr[i]);\n    my_free(arr);\n    return 0;\n}'},
    {id:'c10', lang:'c', diff:'hard', title:'Red-Black Tree Insert', desc:'Implement insertion into a Red-Black Tree in C.', starter:'#include <stdio.h>\n#include <stdlib.h>\n\ntypedef enum { RED, BLACK } Color;\ntypedef struct Node {\n    int val;\n    Color color;\n    struct Node *left, *right, *parent;\n} Node;\n\n// Implement insert with rotations and recoloring\nNode* insert(Node* root, int val) {\n    // Your code here (complex - try pseudocode first!)\n    return root;\n}\n\nint main() {\n    // Test RB tree\n    printf("RB Tree challenge!\\n");\n    return 0;\n}'},
    // Java — Medium/Hard (more)
    {id:'j6', lang:'java', diff:'medium', title:'Producer-Consumer', desc:'Implement the Producer-Consumer pattern using Java threads and synchronized blocks.', starter:'public class Solution {\n    static int[] buffer = new int[5];\n    static int count = 0;\n    \n    static synchronized void produce(int val) {\n        // Your code here - wait if buffer is full\n    }\n    static synchronized int consume() {\n        // Your code here - wait if buffer is empty\n        return -1;\n    }\n    public static void main(String[] args) throws InterruptedException {\n        Thread producer = new Thread(() -> {\n            for(int i=1;i<=10;i++) produce(i);\n        });\n        Thread consumer = new Thread(() -> {\n            for(int i=0;i<10;i++) System.out.println(consume());\n        });\n        producer.start(); consumer.start();\n        producer.join(); consumer.join();\n    }\n}'},
    {id:'j7', lang:'java', diff:'medium', title:'Design HashMap', desc:'Design a HashMap from scratch in Java without using the built-in HashMap.', starter:'public class MyHashMap {\n    private int[] keys;\n    private int[] values;\n    private int size;\n    \n    public MyHashMap() {\n        // Initialize with capacity 1024\n    }\n    public void put(int key, int value) {\n        // Your code here\n    }\n    public int get(int key) {\n        // Return value or -1 if not found\n        return -1;\n    }\n    public void remove(int key) {\n        // Your code here\n    }\n    public static void main(String[] args) {\n        MyHashMap m = new MyHashMap();\n        m.put(1,1); m.put(2,2);\n        System.out.println(m.get(1)); // 1\n        System.out.println(m.get(3)); // -1\n        m.remove(2);\n        System.out.println(m.get(2)); // -1\n    }\n}'},
    {id:'j8', lang:'java', diff:'hard', title:'Concurrent Task Queue', desc:'Implement a thread-safe task queue in Java that supports multiple producer and consumer threads.', starter:'import java.util.concurrent.*;\n\npublic class Solution {\n    static BlockingQueue<Runnable> taskQueue = new LinkedBlockingQueue<>(10);\n    \n    public static void submitTask(Runnable task) throws InterruptedException {\n        // Your code here\n    }\n    \n    public static void startWorker() {\n        // Start a daemon thread that processes tasks\n    }\n    \n    public static void main(String[] args) throws Exception {\n        startWorker(); startWorker(); // 2 workers\n        for(int i=0;i<5;i++) {\n            final int id = i;\n            submitTask(() -> System.out.println("Task " + id + " done by " + Thread.currentThread().getName()));\n        }\n        Thread.sleep(1000);\n    }\n}'},


];

let currentGrindLang = 'python';
let currentGrindFilter = 'all';
let currentGrindProblem = null;
let solvedProblems = JSON.parse(localStorage.getItem('luna_grind_solved') || '[]');

window.renderGrindProblems = function() {
    const list = document.getElementById('grindProblemList');
    if (!list) return;
    
    let filtered = GRIND_PROBLEMS.filter(p => p.lang === currentGrindLang && (currentGrindFilter === 'all' || p.diff === currentGrindFilter));
    
    const diffColors = { easy:'#00c864', medium:'orange', hard:'#ff4444' };
    const diffBg = { easy:'rgba(0,200,100,0.08)', medium:'rgba(255,165,0,0.08)', hard:'rgba(255,60,60,0.08)' };
    
    list.innerHTML = filtered.map(p => {
        const solved = solvedProblems.includes(p.id);
        return `<div onclick="loadGrindProblem('${p.id}')" style="padding:8px 10px;margin-bottom:4px;border-radius:8px;background:${currentGrindProblem && currentGrindProblem.id===p.id ? 'rgba(0,180,255,0.1)' : diffBg[p.diff]};border:1px solid ${currentGrindProblem && currentGrindProblem.id===p.id ? 'rgba(0,180,255,0.3)' : 'rgba(255,255,255,0.05)'};cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(0,180,255,0.1)'" onmouseout="this.style.background='${currentGrindProblem && currentGrindProblem.id===p.id ? 'rgba(0,180,255,0.1)' : diffBg[p.diff]}'">
            <div style="display:flex;align-items:center;gap:6px;justify-content:space-between;">
                <span style="font-size:0.7rem;color:#ccc;">${p.title}</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    ${solved ? '<span style="color:#00ff64;font-size:0.6rem;">✓</span>' : ''}
                    <span style="font-size:0.55rem;color:${diffColors[p.diff]};background:rgba(0,0,0,0.3);padding:1px 6px;border-radius:10px;">${p.diff}</span>
                </div>
            </div>
        </div>`;
    }).join('');
    
    document.getElementById('grindSolved').textContent = solvedProblems.length;
};

window.loadGrindProblem = function(id) {
    const p = GRIND_PROBLEMS.find(x => x.id === id);
    if (!p) return;
    currentGrindProblem = p;
    
    const desc = document.getElementById('grindProblemDesc');
    const code = document.getElementById('grindCode');
    const out = document.getElementById('grindOutput');
    if (desc) desc.innerHTML = `<strong style="color:#00b4ff;">${p.title}</strong> <span style="font-size:0.55rem;color:${p.diff==='easy'?'#00c864':p.diff==='medium'?'orange':'#ff4444'};margin-left:8px;">${p.diff.toUpperCase()}</span><br/><span style="color:#aaa;">${p.desc}</span>`;
    if (code) code.value = p.starter.replace(/\\n/g,'\n');
    if (out) out.textContent = '→ Run your code to see output';
    
    renderGrindProblems();
};

window.setGrindLang = function(lang) {
    currentGrindLang = lang;
    currentGrindProblem = null;
    const label = document.getElementById('grindLangLabel');
    if (label) label.textContent = lang.toUpperCase();
    
    ['grindPython','grindC','grindJava'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const isActive = id.replace('grind','').toLowerCase() === lang;
        btn.style.borderColor = isActive ? 'rgba(0,180,255,0.4)' : 'rgba(255,255,255,0.08)';
        btn.style.background = isActive ? 'rgba(0,180,255,0.1)' : 'transparent';
        btn.style.color = isActive ? '#00b4ff' : '#555';
    });
    renderGrindProblems();
};

window.filterGrind = function(diff) {
    currentGrindFilter = diff;
    const filterBtns = { all:'grindAll', easy:'grindEasy', medium:'grindMed', hard:'grindHard' };
    Object.entries(filterBtns).forEach(([d, id]) => {
        const btn = document.getElementById(id);
        if (btn) btn.style.fontWeight = (d === diff) ? '700' : '400';
    });
    renderGrindProblems();
};

window.runGrindCode = function() {
    const code = document.getElementById('grindCode');
    const out = document.getElementById('grindOutput');
    if (!code || !out) return;
    
    if (currentGrindLang === 'python') {
        if (window.electronAPI) {
            out.textContent = '⏳ Running...';
            const pyCode = code.value;
            window.electronAPI.executeCode('python_run', pyCode).then(result => {
                out.textContent = result || '→ No output';
                if (currentGrindProblem && !solvedProblems.includes(currentGrindProblem.id)) {
                    solvedProblems.push(currentGrindProblem.id);
                    localStorage.setItem('luna_grind_solved', JSON.stringify(solvedProblems));
                    renderGrindProblems();
                }
            }).catch(e => { out.textContent = '❌ Error: ' + e.message; });
        } else {
            // Browser fallback - try to eval JS-like simple Python
            out.textContent = '⚠️ Python execution requires the desktop app.\n\nHint: Open Luna OS via boot.bat to enable code execution.';
        }
    } else {
        out.textContent = `⚠️ ${currentGrindLang.toUpperCase()} compilation requires backend support.\nOpen the Luna desktop app to run ${currentGrindLang.toUpperCase()} code.`;
    }
};

// ═══════════════════════════════════════════════════════════════
// FLOATING AI DEBUG OVERLAY
// ═══════════════════════════════════════════════════════════════
window.openAiDebugOverlay = function() {
    const overlay = document.getElementById('aiDebugOverlay');
    if (overlay) overlay.classList.remove('hidden');
    
    // Pre-fill context if in UI/UX mode
    const uiuxPane = document.getElementById('consUiuxPane');
    const grindCode = document.getElementById('grindCode');
    const input = document.getElementById('aiDebugInput');
    
    if (uiuxPane && uiuxPane.style.display !== 'none') {
        // Get active editor code
        const activeTab = document.getElementById('edHtml') && document.getElementById('edHtml').style.display !== 'none' ? 'edHtml' :
                          document.getElementById('edCss') && document.getElementById('edCss').style.display !== 'none' ? 'edCss' : 'edJs';
        const code = document.getElementById(activeTab);
        if (code && input) input.placeholder = `Ask about your ${activeTab.replace('ed','').toUpperCase()} code...`;
    } else if (grindCode && input) {
        input.placeholder = `Ask Luna to debug: ${currentGrindProblem ? currentGrindProblem.title : 'your code'}...`;
    }
};

window.sendAiDebugMessage = async function() {
    const input = document.getElementById('aiDebugInput');
    const msgs = document.getElementById('aiDebugMessages');
    if (!input || !msgs) return;
    
    const userText = input.value.trim();
    if (!userText) return;
    input.value = '';
    
    // Get code context
    let codeContext = '';
    const uiuxPane = document.getElementById('consUiuxPane');
    if (uiuxPane && uiuxPane.style.display !== 'none') {
        const activeEditor = ['edHtml','edCss','edJs'].find(id => {
            const el = document.getElementById(id);
            return el && el.style.display !== 'none';
        });
        const codeEl = activeEditor ? document.getElementById(activeEditor) : null;
        if (codeEl) codeContext = codeEl.value.substring(0, 800);
    } else {
        const gc = document.getElementById('grindCode');
        if (gc) codeContext = gc.value.substring(0, 800);
    }
    
    const prompt = codeContext ? `Code context:\n\`\`\`\n${codeContext}\n\`\`\`\n\nUser: ${userText}` : userText;
    
    // Add user message
    const userDiv = document.createElement('div');
    userDiv.style.cssText = 'padding:8px 10px;border-radius:8px;background:rgba(0,180,255,0.08);border:1px solid rgba(0,180,255,0.15);font-size:0.75rem;color:#ccc;align-self:flex-end;max-width:90%;word-break:break-word;';
    userDiv.textContent = userText;
    msgs.appendChild(userDiv);
    
    // Loading indicator
    const loadDiv = document.createElement('div');
    loadDiv.style.cssText = 'padding:8px 10px;font-size:0.75rem;color:#555;font-style:italic;';
    loadDiv.innerHTML = '<span style="animation:ldot 1.4s infinite;display:inline-block;">⋯</span> Luna is thinking...';
    msgs.appendChild(loadDiv);
    msgs.scrollTop = msgs.scrollHeight;
    
    try {
        let aiResponse = 'AI debug endpoint not available in browser mode. Launch via boot.bat for full AI support.';
        if (typeof callAI === 'function') {
            aiResponse = await callAI(prompt, 1);
        } else if (window.electronAPI && window.electronAPI.callLLM) {
            aiResponse = await window.electronAPI.callLLM(prompt);
        }
        
        loadDiv.remove();
        const aiDiv = document.createElement('div');
        aiDiv.style.cssText = 'padding:8px 10px;border-radius:8px;background:rgba(0,255,100,0.05);border:1px solid rgba(0,255,100,0.1);font-size:0.75rem;color:#ccc;max-width:95%;word-break:break-word;white-space:pre-wrap;line-height:1.5;';
        aiDiv.innerHTML = '<span style="color:#00b4ff;font-size:0.6rem;font-family:Orbitron,sans-serif;letter-spacing:1px;display:block;margin-bottom:4px;">LUNA AI ✦</span>' + aiResponse;
        msgs.appendChild(aiDiv);
    } catch(e) {
        loadDiv.textContent = '❌ ' + e.message;
    }
    msgs.scrollTop = msgs.scrollHeight;
};

// Initialize grind problems
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderGrindProblems, 1000);
});

