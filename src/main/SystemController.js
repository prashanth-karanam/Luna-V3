const { ipcMain, clipboard, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function initSystemController() {
  ipcMain.handle('list-files', async (event, dirPath) => {
    try {
      // Expand ~ to user home
      if (dirPath.startsWith('~/') || dirPath === '~') {
         dirPath = dirPath.replace(/^~/, require('os').homedir());
      }
  
      const files = fs.readdirSync(dirPath);
      const fileData = files.map(f => {
         const fullPath = path.join(dirPath, f);
         try {
           const stat = fs.statSync(fullPath);
           return { name: f, isDir: stat.isDirectory(), mtime: stat.mtime };
         } catch(e) { return { name: f, isDir: false }; }
      });
      
      // Sort newest first
      fileData.sort((a,b) => (b.mtime || 0) - (a.mtime || 0));
      
      // Return top 30
      const listStr = fileData.slice(0, 30).map(f => `${f.name} (${f.isDir ? 'DIR' : 'FILE'})`).join('\n');
      return { ok: true, content: listStr };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('clipboard-action', (event, action, text) => {
    try {
      if (action === 'read') {
        return { ok: true, text: clipboard.readText() };
      } else if (action === 'write') {
        clipboard.writeText(text || '');
        return { ok: true, message: 'Copied to clipboard' };
      } else if (action === 'clear') {
        clipboard.clear();
        return { ok: true, message: 'Clipboard cleared' };
      }
      return { error: 'Unknown clipboard action' };
    } catch(e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('write-file', async (event, filePath, fileContent) => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, fileContent, 'utf8');
      return { ok: true };
    } catch(e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return { ok: true, content: content };
    } catch(e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('run-command', (event, cmd) => {
    return new Promise((resolve) => {
      exec(cmd, { shell: true }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          error: error ? error.message : null
        });
      });
    });
  });

  ipcMain.handle('open-chrome', async (event, data) => {
    try {
      let url = data;
      let browserName = 'default';
      if (typeof data === 'object' && data !== null) {
        url = data.url;
        browserName = data.browserName ? data.browserName.toLowerCase() : 'default';
      }
      
      if (browserName === 'default') {
        await shell.openExternal(url);
      } else {
        let exe = 'start ""';
        if (browserName.includes('chrome')) exe = 'start chrome';
        else if (browserName.includes('edge')) exe = 'start msedge';
        else if (browserName.includes('brave')) exe = 'start brave';
        else if (browserName.includes('firefox')) exe = 'start firefox';
        else {
           const ps1Path = path.join(__dirname, '..', '..', 'utils', 'launch_app.ps1');
           exec(`powershell -ExecutionPolicy Bypass -File "${ps1Path}" "${browserName}"`);
           return { ok: true };
        }
  
        exec(`${exe} "${url}"`, (err) => {
           if (err) shell.openExternal(url); // fallback to default if missing
        });
      }
      return { ok: true };
    } catch(e) { return { error: e.message }; }
  });

  ipcMain.handle('transcribe-audio', async (event, base64) => {
    return new Promise((resolve) => {
      const scriptPath = path.join(__dirname, '..', '..', 'offline_asr', 'transcribe.js');
      const modelPath = path.join(__dirname, '..', '..', 'offline_asr', 'whisper-large-v3-turbo-q5_0.gguf');
      const cp = require('child_process').spawn('node', [scriptPath, '--stdin', modelPath]);
      let stdout = '';
      let stderr = '';
      cp.stdout.on('data', (d) => stdout += d.toString());
      cp.stderr.on('data', (d) => stderr += d.toString());
      cp.on('close', (code) => {
        if (code === 0) {
          resolve({ ok: true, text: stdout.trim() });
        } else {
          resolve({ error: stderr || 'Unknown error' });
        }
      });
      cp.stdin.write(base64);
      cp.stdin.end();
    });
  });
}

module.exports = { initSystemController };
