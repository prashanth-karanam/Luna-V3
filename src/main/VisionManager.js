const { ipcMain, desktopCapturer } = require('electron');
const http = require('http');

function initVisionManager() {
  ipcMain.handle('vision-screen', async () => {
    return new Promise(async (resolve) => {
      try {
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1280, height: 720 } });
        if (!sources || sources.length === 0) return resolve({ error: 'No screen found' });
        
        const base64Img = sources[0].thumbnail.toDataURL().split(',')[1];
        resolve({ ok: true, base64: base64Img });
      } catch(e) { resolve({ error: e.message }); }
    });
  });
}

module.exports = { initVisionManager };
