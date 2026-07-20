const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    let validChannels = ["toMain"];
    if (validChannels.includes(channel)) ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    let validChannels = ["fromMain", "sys-metrics", "terminal-stream"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});

// Expose Groq Whisper transcription via Node.js (bypasses Electron renderer network block)
contextBridge.exposeInMainWorld('electronAPI', {
    updatePersonality: (data) => ipcRenderer.invoke('tars-personality', data),
    transcribeAudio: (base64) => ipcRenderer.invoke('transcribe-audio', base64),
  captureScreen: () => ipcRenderer.invoke('vision-screen'),

    writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  runCommand: (cmd) => ipcRenderer.invoke('run-command', cmd),
  clipboardAction: (action, text) => ipcRenderer.invoke('clipboard-action', action, text),

  // LLM Routing APIs
  startLLMStream: (payload) => ipcRenderer.invoke('llm-generate-stream', payload),
  onLLMToken: (callback) => { ipcRenderer.removeAllListeners('llm-token'); ipcRenderer.on('llm-token', (e, chunk) => callback(chunk)); },
  onLLMEnd: (callback) => { ipcRenderer.removeAllListeners('llm-end'); ipcRenderer.on('llm-end', () => callback()); },
  onLLMError: (callback) => { ipcRenderer.removeAllListeners('llm-error'); ipcRenderer.on('llm-error', (e, err) => callback(err)); },

  readFile: (path) => ipcRenderer.invoke('read-file', path),
  openChrome: (data) => ipcRenderer.invoke('open-chrome', data),
  runPython: (script, args) => ipcRenderer.invoke('run-python', script, args),
  lunaNotify: (title, body) => ipcRenderer.invoke('luna-notify', title, body),
  memoryRemember: (key, value) => ipcRenderer.invoke('memory-remember', key, value),
  memoryRecall: (key) => ipcRenderer.invoke('memory-recall', key),
  memoryForget: (key) => ipcRenderer.invoke('memory-forget', key),

  // --- Code Execution Engine (Open Interpreter port) ---
  executeCode: (lang, code) => ipcRenderer.invoke('code-execute', lang, code),
  stopCode: (lang) => ipcRenderer.invoke('code-stop', lang),
  killCode: (lang) => ipcRenderer.invoke('code-kill', lang),
  codeStatus: () => ipcRenderer.invoke('code-status'),
  onCodeOutput: (callback) => ipcRenderer.on('code-output', (e, data) => callback(data)),

  // --- Computer Control (Mouse / Keyboard / Clipboard) ---
  mouseMove: (x, y) => ipcRenderer.invoke('mouse-move', x, y),
  mouseClick: (x, y, button) => ipcRenderer.invoke('mouse-click', x, y, button),
  mouseDblClick: (x, y) => ipcRenderer.invoke('mouse-dblclick', x, y),
  mouseScroll: (amount) => ipcRenderer.invoke('mouse-scroll', amount),
  keyboardType: (text) => ipcRenderer.invoke('keyboard-type', text),
  keyboardPress: (key) => ipcRenderer.invoke('keyboard-press', key),
  keyboardHotkey: (combo) => ipcRenderer.invoke('keyboard-hotkey', combo),
  clipboardRead: () => ipcRenderer.invoke('clipboard-read'),
  clipboardWrite: (text) => ipcRenderer.invoke('clipboard-write', text),
  screenInfo: () => ipcRenderer.invoke('screen-info'),
  getActiveWindow: () => ipcRenderer.invoke('active-window'),
  osNotify: (title, body) => ipcRenderer.invoke('os-notify', title, body)
});

// --- OS Bridge for Autonomy ---
const fs = require('fs');
const cp = require('child_process');
const path = require('path');

contextBridge.exposeInMainWorld('osAPI', {
  path: {
    isAbsolute: (p) => path.isAbsolute(p),
    dirname: (p) => path.dirname(p),
    join: (...paths) => path.join(...paths),
    basename: (p) => path.basename(p)
  },
  readFileSync: (path, enc) => fs.readFileSync(path, enc),
  writeFileSync: (path, data, enc) => fs.writeFileSync(path, data, enc),
  readdirSync: (path) => fs.readdirSync(path),
  statSync: (path) => {
    let s = fs.statSync(path);
    return { isDirectory: s.isDirectory(), size: s.size };
  },
  existsSync: (path) => fs.existsSync(path),
  unlinkSync: (path) => fs.unlinkSync(path),
  renameSync: (oldPath, newPath) => fs.renameSync(oldPath, newPath),
  mkdirSync: (path) => fs.mkdirSync(path, { recursive: true }),
  exec: (cmd) => new Promise((resolve, reject) => {
    cp.exec(cmd, { shell: 'powershell.exe', timeout: 30000 }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  })
});
