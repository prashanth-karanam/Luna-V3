const LUNA_MODALS = {
  'historyModal': `<div id="historyModal" class="modal-overlay hidden">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">📜 Past Conversations</div>
        <button class="modal-close" id="closeHistory">✕</button>
      </div>
      <div class="history-list" id="historyList" style="padding: 10px; max-height: 400px; overflow-y: auto;">
        <!-- JS populates this -->
      </div>
      <div class="modal-footer">
        <button class="btn-primary" id="newChatBtn">Start New Chat</button>
      </div>
    </div>
  </div>`,
  'storageModal': `<div id="storageModal" class="modal-overlay hidden">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">📁 Luna Data Bank</div>
        <button class="modal-close" id="closeStorage">✕</button>
      </div>
      <div style="padding: 20px;">
        <div id="dropZone" style="border: 2px dashed var(--border); padding: 40px; text-align: center; border-radius: var(--r-sm); color: var(--dim); cursor: pointer; transition: all 0.2s;">
           Drag & Drop files here to teach Luna<br><br>
           <span style="font-size: 0.75rem; color: var(--blue);">Supports .txt, .json, .csv, .js, .py, etc.</span>
           <input type="file" id="fileUpload" multiple style="display:none;" />
        </div>
        <div id="storageList" style="margin-top: 15px; font-size: 0.8rem; color: var(--blue); max-height: 100px; overflow-y: auto;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-outline" id="clearStorageBtn" style="color:var(--red); border-color:var(--red);">Wipe Data Bank</button>
      </div>
    </div>
  </div>`,
  'memoryModal': `<div id="memoryModal" class="modal-overlay hidden">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">🧠 Luna Long-Term Memory</div>
        <button class="modal-close" id="closeMemory">✕</button>
      </div>
      <div style="padding:16px;">
        <p style="color:var(--dim);font-size:0.8rem;margin-bottom:12px;">
          Write anything you want Luna to <strong style="color:var(--blue)">always remember</strong> — your name, current projects, preferences, coding style. She reads this every single message.
        </p>
        <div id="memoryList" style="max-height:200px;overflow-y:auto;margin-bottom:12px;"></div>
        <div style="display:flex;gap:8px;">
          <input id="memoryInput" type="text" placeholder="e.g. My name is Aryan. I'm building a Web OS." style="flex:1;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);color:var(--text);font-size:0.85rem;" />
          <button class="btn-primary" id="addMemoryBtn" style="padding:10px 16px;white-space:nowrap;">+ Add</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-outline" id="clearMemoryItemsBtn" style="color:var(--red);border-color:var(--red);">Clear All</button>
      </div>
    </div>
  </div>`,
  'settingsModal': `<div id="settingsModal" class="modal-overlay hidden" style="z-index:2100;">
  <div class="modal-card">
    <div class="modal-header" style="cursor: move;" id="settingsDragHandle">
      <div class="modal-title">⚙️ &nbsp;Luna Settings</div>
      <button class="modal-close" id="closeSettings">✕</button>
    </div>

      <div class="tab-bar">
        <button class="tab active" data-tab="luna">Luna</button>
        <button class="tab" data-tab="analytics">Data</button>
        <button class="tab" data-tab="aliases" style="color:#ff6464;">Aliases</button>
      </div>
      <!-- Hidden elements so script.js doesn't crash -->
      <div style="display:none;">
        <select id="activeEngine"><option value="auto">Auto</option></select>
        <textarea id="groqKeys"></textarea>
      </div>
      <div class="tab-panel" id="tab-primary"></div>
      <div class="tab-panel" id="tab-backup"></div>
      
      <div class="tab-panel" id="tab-aliases">
        <h3 style="color:var(--blue); margin-top:0; font-family:'Orbitron',sans-serif;">ALIAS STORAGE</h3>
        <p style="color:var(--dim); font-size:0.85rem; margin-bottom:15px;">Map names to handles (e.g. "Best Friend" -> "@shashank_vr_18") for social automation.</p>
        
        <div style="background:rgba(0,0,0,0.4); border:1px solid var(--border); border-radius:12px; padding:15px; margin-bottom:15px;">
          <div style="display:flex; gap:10px; margin-bottom:10px;">
            <select id="aliasApp" style="flex:1; background:var(--bg-900); border:1px solid var(--border); border-radius:8px; padding:8px; color:#fff;">
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="twitter">Twitter / X</option>
            </select>
            <input type="text" id="aliasName" placeholder="Name (e.g. Best Friend)" style="flex:2; background:var(--bg-900); border:1px solid var(--border); border-radius:8px; padding:8px; color:#fff;" />
          </div>
          <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="text" id="aliasId" placeholder="Target ID / Handle (e.g. @shashank)" style="flex:1; background:var(--bg-900); border:1px solid var(--border); border-radius:8px; padding:8px; color:#fff;" />
            <input type="text" id="aliasLink" placeholder="Direct URL (Optional)" style="flex:1; background:var(--bg-900); border:1px solid var(--border); border-radius:8px; padding:8px; color:#fff;" />
          </div>
          <button id="addAliasBtn" class="btn-primary" style="width:100%; padding:10px; border-radius:8px;">+ Add Alias</button>
        </div>

        <div id="aliasListContainer" style="background:var(--bg-900); border:1px solid var(--border); border-radius:12px; padding:10px; max-height:200px; overflow-y:auto;">
          <!-- Aliases will be injected here via JS -->
        </div>
      </div>
      <div class="tab-panel active" id="tab-luna">
        <div class="setting-row">
          <label style="display:flex; justify-content:space-between; width:100%; align-items:center;">Use Local Model (Ollama)
            <input type="checkbox" id="localModelToggle" style="accent-color:var(--green); width:20px; height:20px;">
          </label>
        </div>
        <div class="setting-row">
          <label>Router Model (Fast) <span style="font-size:0.7rem; color:var(--dim); font-weight:normal;">(e.g. phi3:mini)</span></label>
          <input type="text" id="routerModelInput" placeholder="phi3:mini" style="background:var(--bg-900); border:1px solid var(--border); border-radius:8px; padding:6px 10px; color:#fff; width:150px; text-align:right;">
        </div>
        <div class="setting-row">
          <label>Heavy Lifter Model (Code) <span style="font-size:0.7rem; color:var(--dim); font-weight:normal;">(e.g. phi3:mini)</span></label>
          <input type="text" id="heavyModelInput" placeholder="phi3:mini" style="background:var(--bg-900); border:1px solid var(--border); border-radius:8px; padding:6px 10px; color:#fff; width:150px; text-align:right;">
        </div>
        
          <div class="setting-row" id="localBrowserSetting" style="display: none;">
          <label>External Browser <span style="font-size:0.7rem; color:var(--dim); font-weight:normal;">(For opening links)</span></label>
          <select id="externalBrowserSelect" style="background:var(--bg-900); border:1px solid var(--border); border-radius:8px; padding:6px 10px; color:#fff; width:150px;">
             <option value="default">System Default</option>
             <option value="chrome">Google Chrome</option>
             <option value="msedge">Microsoft Edge</option>
             <option value="brave">Brave</option>
             <option value="firefox">Firefox</option>
             <option value="opera">Opera</option>
          </select>
        </div>
        <div class="setting-row" id="localHelpDesk" style="display: none; flex-direction: column; align-items: flex-start; background: rgba(0,255,100,0.05); border: 1px solid rgba(0,255,100,0.2); border-radius: 8px; padding: 12px; margin-top: 10px;">
           <h4 style="color: var(--green); margin: 0 0 8px 0; font-size: 0.9rem;"><i class="fa-solid fa-circle-info"></i> Local Model Help Desk</h4>
           <ul style="margin: 0; padding-left: 20px; font-size: 0.8rem; color: #ccc; line-height: 1.5;">
             <li><strong>Vision (Optic Nerve):</strong> Requires <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px;">minicpm-v</code> model installed in Ollama.</li>
             <li><strong>Main Brain:</strong> Recommended model is <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px;">phi3:mini</code> for stability.</li>
             <li><strong>OS Permissions:</strong> Using local models grants Luna access to your file system and screen.</li>
             <li><strong>Fixing Issues:</strong> If Luna is unresponsive, ensure the Ollama app is running in your Windows tray.</li>
           </ul>
        </div>
        <div class="setting-row">
          <label>Personality</label>
          <textarea id="systemPrompt" rows="3"></textarea>
        </div>
        <div class="setting-row">
          <label>Voice Engine</label>
          <select id="voiceEngineSetting" style="background:var(--bg-900); border:1px solid var(--border); border-radius:8px; padding:6px 10px; color:#fff; width:150px;">
            <option value="system">System (Fast)</option>
          </select>
        </div>
        <div class="setting-row">
          <label>Wake Word</label>
          <input type="text" id="wakeWord" />
        </div>
        <div class="setting-row">
          <label>Wallpaper Blur</label>
          <input type="range" id="wpBlurRange" min="0" max="40" value="0" style="width:100%; accent-color:var(--blue);" />
        </div>
      </div>
      <div class="tab-panel" id="tab-analytics">
        <div class="setting-row">
          <label style="display:flex; justify-content:space-between; align-items:center;">
            Remember Past Sessions
            <input type="checkbox" id="rememberHistory" style="width:auto; transform:scale(1.2);" />
          </label>
        </div>
        <div class="setting-row" style="margin-top:10px;">
          <label>Token Analytics</label>
          <div class="info-box">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Last 24 Hours:</span> <strong id="tokens24h" style="color:var(--green);">0</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Last 7 Days:</span> <strong id="tokens7d" style="color:var(--blue);">0</strong></div>
            <div style="display:flex; justify-content:space-between;"><span>Total Lifetime:</span> <strong id="tokensAll">0</strong></div>
          </div>
        </div>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:25px 0;">
          
          
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
          
          <div class="setting-item" style="flex-direction:column; align-items:flex-start; margin-bottom:20px; background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; border:1px solid rgba(0,180,255,0.2);">
            <div style="font-size:0.85rem; color:var(--blue); font-weight:bold; margin-bottom:5px;">GHOST BROWSER AUTHENTICATION</div>
            <p style="color:var(--dim); font-size:0.8rem; line-height:1.4; margin-bottom:10px;">Launch the invisible backend browser in visible mode to pre-login to websites (Instagram, Twitter, etc.) before using silent automations.</p>
            <button id="ghostLoginBtn" class="btn-outline" style="width:100%; padding:10px; border-radius:8px; font-size:0.85rem; border-color:var(--blue); color:var(--blue);">Launch Ghost Browser</button>
          </div>
          
          <button id="toggleAdvancedApiBtn" style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:var(--dim); padding:8px 15px; border-radius:8px; cursor:pointer; font-size:0.85rem; margin-bottom:15px; width:100%; text-align:left;">â–¶ Show Advanced API Settings (Individual Providers)</button>
          
          <div id="advancedApiSection" style="display:none;">

          
          <!-- Gemini Custom Key -->
          <div class="setting-item" style="flex-direction:column; align-items:flex-start; margin-bottom:20px; background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; border:1px solid rgba(0,180,255,0.2);">
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" width="20" height="20">
                <span class="setting-label" style="font-weight:bold; color:#fff;">Google Gemini API</span>
              </div>
            </div>
            <div style="font-size:0.8rem; color:var(--dim); margin-bottom:5px;">Backup API Keys (One per line/comma separated)</div>
            <textarea id="geminiKeys" placeholder="AI-123456789\nAI-987654321..." style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid rgba(0,180,255,0.3); background:rgba(0,0,0,0.5); color:#fff; outline:none; margin-bottom:10px; font-family:monospace; font-size:0.8rem; resize:vertical;"></textarea>
            
            <div style="font-size:0.8rem; color:var(--dim); margin-bottom:5px;">Primary API Key</div>
            <input type="password" id="geminiKey" placeholder="Enter Primary Gemini API Key..." style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(0,180,255,0.3); background:rgba(0,0,0,0.5); color:#fff; outline:none; margin-bottom:10px;" />
            <div style="display:flex; gap:10px; width:100%;">
              <button id="verifyGeminiKeyBtn" class="btn-outline" style="flex:1; padding:8px; border-radius:8px; font-size:0.85rem;">Verify Key</button>
              <select id="geminiModel" class="setting-select" style="flex:2; display:none;"></select>
            </div>
            <div id="geminiKeyStatus" style="font-size:0.8rem; margin-top:8px; color:var(--dim);">Status: Using System Pool</div>
          </div>

          <!-- Groq Custom Key -->
          <div class="setting-item" style="flex-direction:column; align-items:flex-start; background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; border:1px solid #f5503633;">
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:20px; height:20px; border-radius:4px; background:#f55036; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#fff; font-size:12px;">G</div>
                <span class="setting-label" style="font-weight:bold; color:#fff;">Groq API</span>
              </div>
            </div>
            <input type="password" id="groqKey" placeholder="Enter Groq API Key..." style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(245,80,54,0.3); background:rgba(0,0,0,0.5); color:#fff; outline:none; margin-bottom:10px;" />
            <div style="display:flex; gap:10px; width:100%;">
              <button id="verifyGroqKeyBtn" class="btn-outline" style="flex:1; padding:8px; border-radius:8px; font-size:0.85rem; border-color:rgba(245,80,54,0.4); color:#f55036;">Verify Key</button>
              <select id="groqModel" class="setting-select" style="flex:2; display:none;">
                <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
              </select>
            </div>
            <div id="groqKeyStatus" style="font-size:0.8rem; margin-top:8px; color:var(--dim);">Status: Using System Pool</div>
          </div>
          </div> <!-- End Advanced Section -->

          <!-- Engine Mode moved to nav bar -->
          <div class="setting-item" style="flex-direction:column; align-items:flex-start; background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; border:1px solid rgba(0,180,255,0.2); margin-bottom:20px;">
            <label style="display:flex; justify-content:space-between; align-items:center; width:100%; cursor:pointer;">
              <span style="font-weight:bold; color:#fff;">Show Thoughts (5-Step Plan)</span>
              <input type="checkbox" id="showThoughtsToggle" checked style="width:auto; transform:scale(1.2);" />
            </label>
            <div style="font-size:0.8rem; margin-top:8px; color:var(--dim);">If disabled, Turbo models will act instantly without printing a 5-step reasoning process.</div>
          </div>

        </div>
        <button class="btn-outline" id="clearMemoryBtn" style="margin-top:10px; color:var(--red); border-color:var(--red);">⚠️ Wipe Memory & Data</button>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="cancelSettings">Cancel</button>
        <button class="btn-primary" id="saveSettings">Save</button>
      </div>
    </div>`,
  'wallpaperModal': `<div id="wallpaperModal" class="modal-overlay hidden">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">🖼️ &nbsp;Choose Wallpaper</div>
        <button class="modal-close" id="closeWallpaper">✕</button>
      </div>
      <div class="wp-scroll-area" style="max-height: 50vh; overflow-y: auto; padding-right: 8px;">
        <div class="wp-section-label">BUILT-IN — NARUTO SERIES</div>
        <div class="wp-grid" id="wpBuiltinGrid">
          <!-- JS populates -->
        </div>
        <div class="wp-section-label" id="wpStorageLabel" style="display:none; margin-top:15px;">FROM DATA BANK</div>
        <div class="wp-grid" id="wpStorageGrid">
          <!-- JS populates -->
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-outline" id="wpResetBtn">Reset to Default</button>
        <button class="btn-secondary btn-outline" id="closeWallpaper2">Cancel</button>
        <button class="btn-primary" id="wpApplyBtn">Apply</button><button class="btn-outline" style="margin-left:auto;" onclick="document.getElementById('wpUploadInput').click()">Upload Custom</button>
        <input type="file" id="wpUploadInput" accept="image/*" style="display:none;" />
      </div>
    </div>
  </div>`,
  'browserModal': `<div id="browserModal" class="modal-overlay hidden">
    <div class="modal-card" style="max-width: 800px; width: 95%; height: 80vh; display: flex; flex-direction: column;">
      <div class="modal-header" style="padding: 10px 15px;">
        <div style="display:flex; align-items:center; gap:10px; width:100%;">
          <div class="modal-title" style="flex-shrink:0;">🌐 Luna Browser</div>
          <input type="text" id="browserUrl" style="flex:1; background:var(--bg-900); border:1px solid var(--border); border-radius:15px; padding:8px 12px; color:var(--text); font-size:0.8rem;" placeholder="Enter URL..."/>
          <button class="btn-primary" id="browserGo" style="padding:8px 14px; font-size:0.8rem;">Go</button>
          <button class="modal-close" id="closeBrowser">✕</button>
        </div>
      </div>
      <div style="flex:1">

        <iframe id="browserFrame" src="about:blank" style="display:none;"></iframe>
      </div>
    </div>
  </div>`,
  'localDiagnosticsModal': `<div id="localDiagnosticsModal" class="hidden" style="position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center;">
    <div style="background:linear-gradient(145deg, rgba(20,20,30,0.9), rgba(10,10,15,0.95)); border:1px solid rgba(255,100,100,0.4); border-radius:24px; padding:35px 25px; width:90%; max-width:550px; box-shadow:0 20px 60px rgba(0,0,0,0.8); text-align:left; max-height:80vh; overflow-y:auto;">
      <h2 style="color:#ff6464; margin:0 0 15px 0; font-family:'Orbitron',sans-serif; font-size: 1.8rem; letter-spacing: 1px; text-align:center;">LOCAL AI DIAGNOSTICS</h2>
      <p style="color:var(--dim); font-size:0.95rem; line-height:1.5; margin-bottom:20px; text-align:center;">Luna couldn't connect to your local Ollama server. Let's fix that!</p>
      
      <div style="background:rgba(255,255,255,0.03); padding:20px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:15px;">
        <h3 style="color:#fff; margin-top:0; margin-bottom:10px;">1. Is Ollama Running?</h3>
        <p style="color:#ddd; font-size:0.9rem; line-height:1.5;">Check your system tray (bottom right of Windows) for the Ollama alpaca icon. If it's not there, launch the Ollama app from your start menu.</p>
      </div>

      <div style="background:rgba(255,255,255,0.03); padding:20px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:15px;">
        <h3 style="color:#fff; margin-top:0; margin-bottom:10px;">2. Is the Model Pulled?</h3>
        <p style="color:#ddd; font-size:0.9rem; line-height:1.5;">You must download the model before Luna can talk to it. Open your terminal and paste this command:</p>
        <code style="background:#000; padding:8px; border-radius:6px; color:#ff6464; display:block; margin:8px 0; font-family:monospace; user-select:all; border:1px solid rgba(255,100,100,0.2);">ollama pull phi3:mini</code>
      </div>

      <div style="background:rgba(255,255,255,0.03); padding:20px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:15px;">
        <h3 style="color:#fff; margin-top:0; margin-bottom:10px;">3. Network & CORS</h3>
        <p style="color:#ddd; font-size:0.9rem; line-height:1.5;">Sometimes your browser blocks the connection for security. To fix this on Windows, open Command Prompt <b>as Administrator</b> and run:</p>
        <code style="background:#000; padding:8px; border-radius:6px; color:#ff6464; display:block; margin:8px 0; font-family:monospace; user-select:all; border:1px solid rgba(255,100,100,0.2);">setx OLLAMA_ORIGINS "*"</code>
        <p style="color:#ddd; font-size:0.9rem; margin-top:8px;">Then completely close and restart Ollama from the system tray.</p>
      </div>
      
      <button onclick="document.getElementById('localDiagnosticsModal').classList.add('hidden')" class="btn-primary" style="width:100%; padding:14px; border-radius:12px; margin-top:10px; font-size:1rem; background: rgba(255,100,100,0.2); border-color: #ff6464; color: #ff6464;">Close Diagnostics</button>
    </div>
  </div>`,
};


(() => {
    const container = document.getElementById('modals-container');
    if (container) {
        let html = '';
        for (const modal in LUNA_MODALS) {
            html += LUNA_MODALS[modal];
        }
        container.innerHTML = html;
    }
})();
