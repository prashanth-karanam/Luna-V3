const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function initMemoryManager(appRoot) {
  const MEMORY_FILE = path.join(appRoot, 'luna_memory.json');

  function loadMemory() {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
      }
    } catch(e) {}
    return {};
  }

  function saveMemory(data) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  ipcMain.handle('memory-remember', (event, key, value) => {
    try {
      const mem = loadMemory();
      mem[key] = { value: value, timestamp: new Date().toISOString() };
      saveMemory(mem);
      return { ok: true, message: 'Remembered: ' + key };
    } catch(e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('memory-recall', (event, key) => {
    try {
      const mem = loadMemory();
      if (key === '__ALL__') {
        return { ok: true, memories: mem };
      }
      if (mem[key]) {
        return { ok: true, key: key, value: mem[key].value, timestamp: mem[key].timestamp };
      }
      return { ok: false, message: 'No memory found for: ' + key };
    } catch(e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('memory-forget', (event, key) => {
    try {
      const mem = loadMemory();
      if (mem[key]) {
        delete mem[key];
        saveMemory(mem);
        return { ok: true, message: 'Forgot: ' + key };
      }
      return { ok: false, message: 'No memory found for: ' + key };
    } catch(e) {
      return { error: e.message };
    }
  });
}

module.exports = { initMemoryManager };
