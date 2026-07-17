
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
  if (window.osAPI && window.osAPI.existsSync('contacts.json')) {
    aliasData = JSON.parse(window.osAPI.readFileSync('contacts.json', 'utf-8'));
  }
} catch (e) { console.error('Failed to load contacts.json:', e); }
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
  RULE 1: You MUST NEVER refer to yourself as "Qwythos" or mention "Empero AI".
  RULE 2: NEVER apologize. NEVER mention that you are a language model, an AI, or tuned by OpenAI/Google. Just DO the task.
  RULE 3: Be ultra-concise. Give exactly the answer requested without huge paragraphs of unnecessary details.
  RULE 4: NEVER explain your internal system mechanisms, how you sent a message, or what tools you used. Just execute them silently.

  [SYSTEMATIC THOUGHT PROCESS]
${(cfg.showThoughts !== false) ? `For EVERY request, you MUST output your internal reasoning BEFORE your final answer or tool usage. Wrap your reasoning in either <thought>...</thought> or <think>...</think> tags.` : `You may execute tools immediately without prior explanation.`}`;

  const cbVision = document.getElementById('includeVisionContext');
  const needsVision = cbVision ? cbVision.checked : false;
  const needsDesktop = /\b(app|open|click|type|python|desktop|automate|control)\b/i.test(userQuery);
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
  You have two search tools. 
  1. SILENT_SEARCH (Google Grounded / DDG): Fast and invisible. Use this FIRST for ALL factual questions, news, LIVE SPORTS SCORES, and weather. Format: ${cfg.showThoughts !== false ? '{"thought": "searching silently", "tool": "SILENT_SEARCH", "query": "your search term"}' : '{"tool": "SILENT_SEARCH", "query": "your search term"}'}
  2. WEB_SEARCH (Browser): Physically opens the user's browser to scrape Google. ONLY use this as a FALLBACK if SILENT_SEARCH fails to give you the exact live sports score or weather data, OR if the user explicitly asks you to open the browser. Format: ${cfg.showThoughts !== false ? '{"thought": "opening browser", "tool": "WEB_SEARCH", "query": "your search term"}' : '{"tool": "WEB_SEARCH", "query": "your search term"}'}
  You MUST use this JSON format to go to a url: ${cfg.showThoughts !== false ? '{"thought": "going", "tool": "WEB_GO", "query": "https://url.com"}' : '{"tool": "WEB_GO", "query": "https://url.com"}'}
  You MUST use this JSON format to read a page: ${cfg.showThoughts !== false ? '{"thought": "reading", "tool": "WEB_READ"}' : '{"tool": "WEB_READ"}'}`;
  }

  if (needsDesktop) {
      base += `
- DESKTOP AUTOMATION & MESSAGING:
  * For Messaging (WhatsApp, Instagram, Telegram, Discord, Messenger), ALWAYS use: ${cfg.showThoughts !== false ? '{"thought": "sending", "response": "Sending message now", "tool": "SEND_MESSAGE", "query": "instagram|username|hello"}' : '{"response": "Sending message now", "tool": "SEND_MESSAGE", "query": "instagram|username|hello"}'}
  * luna_tools.open_path('C:/path/to/file') - Opens a file or folder directly.

  * luna_tools.type_text('text', press_enter=True) - Types text, optionally presses Enter.
  * luna_tools.press('enter') - Presses a single key (enter, tab, escape, etc).
  * luna_tools.hotkey('ctrl', 'c') - Presses a key combination.
  * luna_tools.click_text('visible text') - Finds and clicks text on screen using vision.
  * luna_tools.mouse_click(x, y) - Clicks at exact screen coordinates.
  * luna_tools.scroll(amount) - Scrolls up (positive) or down (negative).
  
  CRITICAL RULES:
  * To open an app: ONLY use luna_tools.open_app('Name'). Call it ONCE. Do NOT loop or retry.
  * To navigate to a website: ONLY use luna_tools.open_url('https://site.com'). NEVER try to type URLs manually into the browser.
  * SMART ROUTING: Construct direct URLs when possible to skip UI navigation (e.g., use 'https://instagram.com/direct/inbox' for DMs, 'https://youtube.com/results?search_query=x' for YT search, 'https://x.com/compose/tweet' for tweeting).
  * NEVER use tab_and_check_until to verify if an app opened. It does NOT do that.
  * Keep code simple: 1-3 lines max. No loops, no complex scripts.
  * Example: {"thought": "Opening Edge", "tool": "EXECUTE_PYTHON", "code": "import luna_tools\\nluna_tools.open_app('Microsoft Edge')"}
  * Example: {"thought": "Going to IG", "tool": "EXECUTE_PYTHON", "code": "import luna_tools\\nluna_tools.open_url('https://instagram.com', browser='opera')"}
  * Example: {"thought": "Typing hello", "tool": "EXECUTE_PYTHON", "code": "import luna_tools\\nluna_tools.type_text('hello', press_enter=True)"}`;
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
  routerModel:  localStorage.getItem('luna_routerModel') || 'qwythos-9b',
  heavyModel:   localStorage.getItem('luna_heavyModel') || 'qwythos-9b',
  engine:       localStorage.getItem('luna_engine')       || 'auto',
  systemPrompt: localStorage.getItem('luna_system')       || '',
  wakeWord:     localStorage.getItem('luna_wakeWord')     || 'wake up luna',
  rememberHistory: localStorage.getItem('luna_rememberHistory') !== 'false',
  optMode:      localStorage.getItem('luna_optMode')      || 'qwythos-9b:latest',
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
// Old speak function removed - using the new typewriter speak() instead.

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


async function callAI(userText, failCount = 0, depth = 0) {
  console.log('[LUNA-DEBUG] callAI entered. depth=' + depth + ' engine=' + cfg.engine + ' optMode=' + cfg.optMode + ' geminiKey=' + (cfg.geminiKey ? 'SET' : 'EMPTY') + ' groqKey=' + (cfg.groqKey ? 'SET' : 'EMPTY') + ' useLocalModel=' + useLocalModel);
  if (window.isAborted) return;
  state.history.push({ role: 'user', text: userText });
  saveHistory();

  // Build system prompt FIRST (used by both local and cloud engines)
  let sysPrompt = "";
  
  sysPrompt += `[IDENTITY]: You are Luna, a highly empathetic, natural, and conversational assistant created by Sai Prashant.
Speak naturally like a close human friend. Do not act robotic. Be concise.
If the user asks you to search, open apps, or do anything on their computer, you MUST use the tool system below. Do NOT make up answers for factual/current-event questions.`;

  const lowerQuery = userText.toLowerCase();
  
  let tempContext = "";
  console.log('[LUNA-DEBUG] Checking web_automation status...');
  try {
    const res = await window.electronAPI.runPython('web_automation.py', ['status']);
    console.log('[LUNA-DEBUG] web_automation returned:', JSON.stringify(res));
    if (res && res.status === 'open') {
      tempContext = `[SYSTEM CONTEXT: Automation Browser is OPEN. Active Tab: '${res.title}', URL: '${res.url}']\n`;
    } else {
      tempContext = `[SYSTEM CONTEXT: Automation Browser is CLOSED.]\n`;
    }
  } catch(e) { console.log('[LUNA-DEBUG] web_automation error:', e); }
  
  // ZERO-LATENCY HYBRID ROUTER
  const actionRegex = /\b(search|open|app|click|type|file|dir|folder|cmd|run|web|google|find|who|what|when|where|why|how|news|latest|score|match|weather|download|install)\b/i;
  let useGemini = false;
  if (actionRegex.test(lowerQuery) && cfg.geminiKey) {
      useGemini = true;
      console.log('[LUNA-DEBUG] Regex Router: Action detected. Routing to Gemini.');
  } else {
      console.log('[LUNA-DEBUG] Regex Router: Normal chat detected. Routing to Local Ollama.');
  }

  sysPrompt += tempContext + getSystemPrompt(lowerQuery);
  if (cfg.systemPrompt.trim() !== '') {
    sysPrompt += `\n\n[ADDITIONAL USER INSTRUCTIONS]:\n${cfg.systemPrompt}`;
  }

  // Route to local Ollama if we decided not to use Gemini for automation
  if (!useGemini) {
    try {
      const ollamaReply = await callOllama(userText, sysPrompt);
      state.history.push({ role: 'model', text: ollamaReply });
      saveHistory();
      const clean = await parseAICommands(ollamaReply, 0, 0);
      return clean;
    } catch(e) {
      console.error('[LUNA-DEBUG] callOllama failed, falling back to cloud:', e);
    }
  }

  const engine = cfg.engine === 'auto' ? (cfg.geminiKey ? 'gemini' : 'groq') : cfg.engine;


  startBrainActivity();
  console.log('[LUNA-DEBUG] Engine resolved to:', engine, 'optMode:', cfg.optMode);

  try {
    let activeEngine = engine;
    
    // Vision-to-Heavy Interceptor Pipeline
    if (activeEngine === 'groq' && attachedImageBase64 && cfg.geminiKey) {
        const visionPrompt = "SYSTEM DIRECTIVE: You are a pure optical character and scene recognition module. Your ONLY job is to describe EXACTLY what is in the attached image in supreme detail. List all text, UI elements, structure, and relevant context. Do NOT answer the user's prompt. Do NOT apologize. Do NOT say you are an AI. Just output the raw visual data.";
        try {
            // This call consumes the attachedImageBase64 and clears it
            const visionDesc = await callCloudAPI("Extract all visual data from the attached image. Output ONLY the description.", visionPrompt, state.geminiIdx, 'gpt-4o-mini');
            
            // Append the perfectly extracted text to the user's prompt for Qwythos
            userText += `\n\n[SYSTEM VISION MODULE CAPTURE]:\n${visionDesc}\n\n[CRITICAL INSTRUCTION FOR QWYTHOS]: The above is a raw text transcription of the user's screen/image provided by a vision module. IGNORE any text where the module claims it is an AI or cannot help. Treat the visual data as your own eyes, and answer my original request!`;
        } catch(e) {
            console.error("Vision extraction failed", e);
        }
    }

    let reply = '';
    console.log('[LUNA-DEBUG] Dispatching to activeEngine:', activeEngine);
    if (activeEngine === 'gemini' && cfg.geminiKey) { console.log('[LUNA-DEBUG] Calling Cloud API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx); }
    else if (activeEngine === 'groq') {
      // Sanitize messages to prevent Groq API crashes
      let messages = [{ role: 'system', content: sysPrompt }];
      getCleanedHistory().slice(-40, -1).forEach(m => {
          messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
      });
      messages.push({ role: 'user', content: userText });
      
      let sanitizedMessages = [];
      for (let msg of messages) {
          if (sanitizedMessages.length > 0 && sanitizedMessages[sanitizedMessages.length - 1].role === msg.role && msg.role !== 'system') {
              sanitizedMessages[sanitizedMessages.length - 1].content += "\n\n" + msg.content;
          } else {
              sanitizedMessages.push(msg);
          }
      }
      if (sanitizedMessages.length > 0 && sanitizedMessages[sanitizedMessages.length - 1].role === 'assistant') {
          sanitizedMessages.push({ role: 'user', content: 'Continue.' });
      }
      messages = sanitizedMessages;

      console.log('[LUNA-DEBUG] Sending to Groq...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx); 
    }
    else if (cfg.geminiKey) { console.log('[LUNA-DEBUG] Fallback to Cloud API...'); reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx); }
    else reply = '⚠️ APIs not configured.';
    console.log('[LUNA-DEBUG] AI reply received. Length:', (reply||'').length, 'Preview:', (reply||'').substring(0, 200));
    
    stopBrainActivity();
    state.history.push({ role: 'model', text: reply });
    saveHistory();
    const clean = await parseAICommands(reply, 0, 0);
    return clean;
  } catch (err) {
    console.error('[LUNA-DEBUG] callAI caught error:', err);
    if (engine === 'gemini' && cfg.groqKey) {
      console.warn('Gemini failed, falling back to Groq...', err);
      showToast(`⚠️ Gemini Limit Hit. Auto-routing to Backup Engine...`, false);
      try { 
        let reply = await callCloudAPI(userText, sysPrompt, state.geminiIdx); 
        stopBrainActivity();
        state.history.push({ role: 'model', text: reply });
    saveHistory();
    const clean = await parseAICommands(reply, 0, 0);
    return clean;
      } catch (e) { 
        stopBrainActivity();
        showToast(`❗ Both Engines Offline. Please wait for cooldown.`, true);
        return `❗ Both engines failed. Please wait for cooldown or switch tiers.`; 
      }
    }
    stopBrainActivity();
    return `❗ Engine Error: ${err.message}`;
  }
}


async function callCloudAPI(userText, sysPrompt, keyIndex = -1, modelOverride = null) {
  let allBackupKeys = cfg.geminiKeys.split(/[\n,; ]+/).map(k => k.trim()).filter(k => k);
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
    let summaryText = "Luna is thinking...";
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
    text = text.replace(/Qwythos/gi, 'Luna AI');
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
      <div class="bubble ${isLuna ? 'lb' : 'ub'}">${formatText(text)}</div>
    </div>
    ${!isLuna ? `<div class="avatar ua">👤</div>` : ''}
  `;
  $('messages').appendChild(row); $('messages').scrollTop = $('messages').scrollHeight;
}

function addBubbleReveal(sender, text) {
  if (sender === 'luna') {
    text = text.replace(/Qwythos/gi, 'Luna AI');
    text = text.replace(/Empero AI/gi, 'Sai Prashant');
    text = text.replace(/Empero/gi, 'Sai Prashant');
  }
  const isLuna = sender === 'luna';
  const row = document.createElement('div'); row.className = `bubble-row${isLuna?'':' user-row'}`;
  row.innerHTML = `
    ${isLuna ? `<div class="avatar la" style="background:transparent;box-shadow:none;"><div class="mini-orb-wrap" style="transform: scale(0.65);"><div class="mini-ring"></div><div class="mini-orb-core"></div></div></div>` : ''}
    <div class="bubble-col${isLuna?'':' uc'}">
      <span class="sender-name">${isLuna ? 'LUNA' : 'YOU'}</span>
      <div class="bubble ${isLuna ? 'lb' : 'ub'}">${formatText(text)}</div>
    </div>
  `;
  $('messages').appendChild(row);
  $('messages').scrollTop = $('messages').scrollHeight;
}

function addWelcomeIfEmpty() {
  if ($('messages').children.length === 0) {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    $('chatGreeting').textContent = `${greet}!`;
    addBubbleReveal('luna', `${greet}! I'm **Luna**, your AI companion.`);
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
if ($('saveSettings')) $('saveSettings').addEventListener('click', () => {
  cfg.geminiKey = $('geminiKey').value.trim();
  cfg.geminiKeys = $('geminiKeys') ? $('geminiKeys').value.trim() : '';
  cfg.geminiModel = $('geminiModel').value;
  cfg.groqKey = $('groqKey').value.trim();
  cfg.groqKeys = $('groqKeys') ? $('groqKeys').value.trim() : '';
  cfg.groqModel = $('groqModel').value;
  if($('routerModelInput')) cfg.routerModel = $('routerModelInput').value.trim() || 'qwythos-9b';
  if($('heavyModelInput')) cfg.heavyModel = $('heavyModelInput').value.trim() || 'qwythos-9b';
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


async function callOllama(userText, sysPrompt = null) {
  // Forcefully truncate sysPrompt for local models to prevent hallucinations (small models crash on the massive system prompt)
  sysPrompt = "You are Luna, a helpful AI assistant. Answer accurately and concisely. Output your final response in plain text.";

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
      messages.push(messageObj);
        if (msg === recentHistory[recentHistory.length - 1] && typeof window.clearImageAttachment === "function") { setTimeout(window.clearImageAttachment, 100); }
      } else {
      let safeText = msg.text;
      if (safeText.length > 0) messages.push({ role: 'assistant', content: safeText });
    }
  }

  // Sanitize messages to prevent Groq API crashes
  let sanitizedMessages = [];
  for (let msg of messages) {
      if (sanitizedMessages.length > 0 && sanitizedMessages[sanitizedMessages.length - 1].role === msg.role && msg.role !== 'system') {
          sanitizedMessages[sanitizedMessages.length - 1].content += "\n\n" + msg.content;
      } else {
          sanitizedMessages.push(msg);
      }
  }
  if (sanitizedMessages.length > 0 && sanitizedMessages[sanitizedMessages.length - 1].role === 'assistant') {
      sanitizedMessages.push({ role: 'user', content: 'Continue.' });
  }
  messages = sanitizedMessages;

  try {
    const activeModel = attachedImageBase64 ? 'minicpm-v:latest' : (cfg.optMode || 'qwythos-9b:latest');
    console.log('[LUNA-DEBUG] callOllama: model=' + activeModel);
    const response = await fetchWithTimeout('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 180000,
      body: JSON.stringify({
        model: activeModel,
        messages: messages,
        stream: false,
        options: { num_ctx: 4096 }
      })
    });

    if (!response.ok) { let errMsg = 'Ollama connection failed. Is it running?'; try { const errJson = await response.json(); if (errJson.error) errMsg = errJson.error; } catch(e) {} throw new Error(errMsg); }
    const data = await response.json();
    console.log('[LUNA-DEBUG] callOllama reply length:', (data.message?.content || '').length);
    return data.message.content;
  } catch (error) {
    console.error("Local Model Error:", error);
    return `<div style="text-align:center;">⚠️ <b>Local AI Connection Failed</b><br><span style="font-size:0.9rem; color:var(--dim);">${error.message}</span><br><br><button onclick="document.getElementById('localDiagnosticsModal').classList.remove('hidden')" style="padding: 10px 15px; background: rgba(255,100,100,0.2); border: 1px solid #ff6464; color: #ff6464; border-radius: 8px; cursor: pointer; font-family:'Orbitron',sans-serif; letter-spacing:1px; font-weight:bold;">🛠️ RUN DIAGNOSTICS</button></div>`;
  }
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
        net.innerHTML = '🟢 Network: UP';
        net.style.color = 'var(--green)';
      } else {
        net.innerHTML = '🔴 Network: DOWN';
        net.style.color = 'var(--red)';
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
        if (window.osAPI) window.osAPI.writeFileSync('contacts.json', JSON.stringify(aliasData, null, 4), 'utf-8');
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
         window.osAPI.writeFileSync('contacts.json', JSON.stringify(aliasData, null, 4), 'utf-8');
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
    cfg.routerModel = e.target.value.trim() || 'qwythos-9b';
    localStorage.setItem('luna_routerModel', cfg.routerModel);
  });
}
if(document.getElementById('heavyModelInput')) {
  document.getElementById('heavyModelInput').addEventListener('change', (e) => {
    cfg.heavyModel = e.target.value.trim() || 'qwythos-9b';
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
  addBubble('luna', '<span id="luna-typing" style="font-style:italic;color:var(--dim);">Luna is thinking... <span id="luna-typing-timer" style="font-family:monospace;font-size:0.8rem;">[0.0s]</span></span>');
  const _timerInterval = setInterval(() => {
    const el = document.getElementById('luna-typing-timer');
    if (el) el.textContent = '[' + ((Date.now() - _procStart) / 1000).toFixed(1) + 's]';
    else clearInterval(_timerInterval);
  }, 100);
  try {
    let reply = await callAI(text);
    clearInterval(_timerInterval);
    if (!reply || reply.trim() === '') reply = 'Task completed.';
    const typingNode = document.getElementById('luna-typing');
    if (typingNode && typingNode.closest('.bubble-row')) {
        typingNode.closest('.bubble-row').remove();
    }
    addBubble('luna', reply);
  } catch(err) {
    clearInterval(_timerInterval);
    console.error('[LUNA] sendMessage error:', err);
    const typingNode = document.getElementById('luna-typing');
    if (typingNode && typingNode.closest('.bubble-row')) {
        typingNode.closest('.bubble-row').remove();
    }
    addBubble('luna', `❗ Error: ${err.message || 'Connection failed. Check your API keys in Settings.'}`);
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
            const pyCode = `import luna_tools, sys\nsys.stdout.reconfigure(encoding='utf-8')\nprint(luna_tools.silent_search("${query}", api_key="${apiKey}"))\n`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            let out = (res.ok && res.output) ? res.output : ((res.error) ? res.error + "\n" + res.output : "Failed to search web silently");
            feedback.push(`[SILENT_SEARCH_RESULTS for ${query}]:\n${out}`);
        }
    },
    'WEB_SEARCH': async (match, feedback) => {
        if (window.electronAPI) {
            const query = match[1].trim().replace(/^["']|["']$/g, '');
            const pyCode = `import luna_browser, sys\nsys.stdout.reconfigure(encoding='utf-8')\ntry:\n    res1 = luna_browser.search("${query}")\n    res2 = luna_browser.get_text()\n    print(f"{res1}\\n\\n--- PAGE CONTENT ---\\n\\n{res2}")\nexcept Exception as e:\n    print(f"Error: {e}")\n`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            let out = (res.ok && res.output) ? res.output : ((res.error) ? res.error + "\n" + res.output : "Failed to search web");
            feedback.push(`[WEB_SEARCH_RESULTS for ${query}]:\n${out}`);
        }
    },
    'WEB_GO': async (match, feedback) => {
        if (window.electronAPI) {
            const url = match[1].trim().replace(/^["']|["']$/g, '');
            const pyCode = `import luna_browser\nprint(luna_browser.go_to("${url}"))`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            feedback.push(`[SYSTEM]: Navigated to ${url}. Result: ${res.output}`);
        }
    },
    'OPEN_APP': async (match, feedback) => {
        if (window.electronAPI) {
            let appName = match[1].trim().replace(/ app$/i, '').replace(/"/g, '\"');
            const pyCode = `import luna_tools\nluna_tools.open_app("${appName}")`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            if (res.ok && res.output.includes('Successfully')) {
                feedback.push(`[SYSTEM]: Successfully found and launched ${appName}.`);
            } else {
                feedback.push(`[SYSTEM]: Failed to launch ${appName}.`);
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
            const pyCode = `import luna_browser\nprint(luna_browser.smart_click("${sel}"))`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            feedback.push(`[SYSTEM]: WEB_CLICK Result: ${res.output}`);
        }
    },
    'WEB_PRESS': async (match, feedback) => {
        if (window.electronAPI) {
            const key = match[1].trim();
            const pyCode = `import luna_browser\nprint(luna_browser.press("${key}"))`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            feedback.push(`[SYSTEM]: WEB_PRESS Result: ${res.output}`);
        }
    },
    'SEND_MESSAGE': async (match, feedback) => {
        if (window.electronAPI) {
            const args = match[1].trim().split('|');
            if (args.length < 3) {
                feedback.push('[SYSTEM_ERROR]: SEND_MESSAGE requires platform|receiver|message');
                return;
            }
            const pyCode = `import luna_message\nprint(luna_message.send_message({'platform': '${args[0].trim()}', 'receiver': '${args[1].trim()}', 'message_text': '''${args.slice(2).join('|').trim()}'''}))`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            feedback.push(`[SYSTEM_MSG]: ${res.output || res.error}`);
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
            const pyCode = `import luna_browser\nprint(luna_browser.get_text())`;
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
        } else if (parsed.tool_code) {
            reconstructed += `[EXECUTE_PYTHON]\n${parsed.tool_code}\n[/EXECUTE_PYTHON]`;
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
            if (AI_COMMAND_REGISTRY[tag]) {
                await AI_COMMAND_REGISTRY[tag](shiftedMatch, feedback);
            } else if (tag === 'RUN_CMD') {
                if (AI_COMMAND_REGISTRY['CMD']) await AI_COMMAND_REGISTRY['CMD'](shiftedMatch, feedback);
            }
        }

        // Regex for tags with 2 parameters (separated by |)
        const tag2Regex = /\[(WRITE_FILE|RENAME_FILE|SEARCH_FILES|DOWNLOAD_FILE):([\s\S]*?)\|([\s\S]*?)\]/gi;
        while ((match = tag2Regex.exec(text)) !== null) {
            const tag = match[1].toUpperCase();
            const shiftedMatch = [match[0], match[2], match[3]];
            if (AI_COMMAND_REGISTRY[tag]) {
                await AI_COMMAND_REGISTRY[tag](shiftedMatch, feedback);
            }
        }
        
        // Regex for no parameter tags
        const noArgRegex = /\[(WEB_READ|BROWSER_ANALYZE|CAPTURE_BROWSER|CAPTURE_SCREEN|STOP_CODE|CLIPBOARD_READ|SCREEN_INFO)\]/gi;
        while ((match = noArgRegex.exec(text)) !== null) {
            const tag = match[1].toUpperCase();
            if (AI_NO_ARG_REGISTRY[tag]) {
                await AI_NO_ARG_REGISTRY[tag](feedback);
            }
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
            if (typeof addCodeBlock === 'function') addCodeBlock('python', pyCode);
            const res = await window.electronAPI.executeCode('python', pyCode);
            if (res.ok) {
                feedback.push(`[PYTHON_OUTPUT]:\n${res.output}`);
            } else {
                feedback.push(`[PYTHON_ERROR]: ${res.error || 'Unknown error'}\nPartial output: ${res.output || 'none'}`);
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




