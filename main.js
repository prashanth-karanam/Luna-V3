const { app, BrowserWindow, session, ipcMain, Notification } = require('electron');
const path = require('path');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Fix: set a dedicated user data path to avoid 'Access is denied' cache conflicts
app.setPath('userData', path.join(app.getPath('appData'), 'LunaAI'));

// Disable GPU shader disk cache & problematic caches that cause Windows permission errors
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disk-cache-size', '1');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('log-level', '3'); // Suppress chunked_data_pipe network spam
app.disableHardwareAcceleration();

const { initVisionManager } = require('./src/main/VisionManager');

const { initSystemController } = require('./src/main/SystemController');
const { initPythonTools } = require('./src/main/PythonTools');
const { initMemoryManager } = require('./src/main/MemoryManager');
const { initCodeRunner } = require('./src/main/CodeRunner');
const { initComputerControl } = require('./src/main/ComputerControl');

initVisionManager();

initSystemController();
initPythonTools(__dirname);
initMemoryManager(__dirname);
initCodeRunner();
initComputerControl();

ipcMain.handle('luna-notify', (event, title, body) => {
  try {
    if (Notification.isSupported()) {
      const notif = new Notification({ title: title || 'Luna AI', body: body || '' });
      notif.show();
      return { ok: true, message: 'Notification sent' };
    }
    return { error: 'Notifications not supported on this system' };
  } catch (e) {
    return { error: e.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: "Luna AI Web OS"
  });

  // Spoof user-agent: remove "Electron" so Instagram/social sites don't block us
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  win.webContents.setUserAgent(chromeUA);
  session.defaultSession.setUserAgent(chromeUA);

  win.loadFile('index.html');
  win.setMenuBarVisibility(false);

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
    // Force focus into the renderer so typing works immediately
    win.webContents.executeJavaScript(`
      document.body && document.body.click();
      const inp = document.getElementById('msgInput');
      if(inp) { inp.focus(); inp.blur(); }
    `).catch(()=>{});
  });

  // Capture renderer console messages for debugging
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer console] ${message}`);
  });

  return win;
}

app.whenReady().then(() => {
  // Grant mic/camera/notifications permissions automatically (needed for voice + social sites)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'audioCapture', 'videoCapture', 'geolocation', 'notifications', 'clipboard-read'];
    callback(allowed.includes(permission));
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    const allowed = ['media', 'audioCapture', 'videoCapture', 'geolocation', 'notifications', 'clipboard-read'];
    return allowed.includes(permission);
  });

  session.defaultSession.setDevicePermissionHandler((details) => {
    return true; // Auto-allow all device requests
  });

  // Strip headers that block embedding of sites like YouTube/Instagram
  session.defaultSession.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
    const headers = details.responseHeaders;
    // Remove headers that block iframes/webviews
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    delete headers['x-content-type-options'];
    delete headers['X-Content-Type-Options'];
    callback({ responseHeaders: headers });
  });

  app.on('web-contents-created', (event, contents) => {
    // Trap all new window requests (e.g. target="_blank") and force them into the same view
    contents.setWindowOpenHandler(({ url }) => {
      contents.loadURL(url);
      return { action: 'deny' };
    });
  });

  const win = createWindow();
  
  // Start background system hardware monitoring
  const { startSystemMonitor } = require('./src/main/SystemMonitor');
  startSystemMonitor(win);
  
  // Start terminal output stream to frontend
  const { startTerminalLogger } = require('./src/main/TerminalLogger');
  startTerminalLogger(win);
  
  // Start dummy audio listener and Whisper server
  try {
    const { silentSpawn } = require('./utils/silentExec');
    const listener = silentSpawn('node', [path.join(__dirname, 'audio_listener', 'listener.js')]);
    listener.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg === 'WAKE') {
        win.webContents.send('wake-up');
      }
    });

    const whisperExe = path.join(__dirname, 'offline_asr', 'Release', 'whisper-server.exe');
    const whisperModel = path.join(__dirname, 'offline_asr', 'whisper-large-v3-turbo-q5_0.gguf');
    const whisperServer = silentSpawn(whisperExe, ['-m', whisperModel, '--port', '8080']);
    whisperServer.stdout.on('data', (d) => console.log('[Whisper]', d.toString()));
    whisperServer.stderr.on('data', (d) => console.log('[Whisper]', d.toString()));

    app.on('before-quit', () => {
      if (listener && !listener.killed) listener.kill();
      if (whisperServer && !whisperServer.killed) whisperServer.kill();
    });
  } catch(e) {
    console.warn("Could not start background processes:", e);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
