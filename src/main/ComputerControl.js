const { ipcMain } = require('electron');
const { exec } = require('child_process');

function runPS(script) {
  return new Promise((resolve, reject) => {
    exec(`powershell.exe -NoProfile -Command "${script.replace(/"/g, '\\"')}"`, 
      { windowsHide: true, timeout: 10000 },
      (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      }
    );
  });
}

function initComputerControl() {
  // ─── Mouse Control ───
  ipcMain.handle('mouse-move', async (event, x, y) => {
    try {
      await runPS(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})`);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle('mouse-click', async (event, x, y, button = 'left') => {
    try {
      // Move first, then click
      const moveScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})`;
      
      const clickScript = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class MouseHelper {
    [DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
}
'@
${button === 'right' ? 
  '[MouseHelper]::mouse_event(0x0008, 0, 0, 0, 0); [MouseHelper]::mouse_event(0x0010, 0, 0, 0, 0)' :
  '[MouseHelper]::mouse_event(0x0002, 0, 0, 0, 0); [MouseHelper]::mouse_event(0x0004, 0, 0, 0, 0)'}
`;
      await runPS(moveScript);
      await runPS(clickScript);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle('mouse-dblclick', async (event, x, y) => {
    try {
      await runPS(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})`);
      const clickScript = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class MouseHelper2 {
    [DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
}
'@
[MouseHelper2]::mouse_event(0x0002, 0, 0, 0, 0); [MouseHelper2]::mouse_event(0x0004, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MouseHelper2]::mouse_event(0x0002, 0, 0, 0, 0); [MouseHelper2]::mouse_event(0x0004, 0, 0, 0, 0)
`;
      await runPS(clickScript);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle('mouse-scroll', async (event, amount) => {
    try {
      // amount > 0 = scroll up, < 0 = scroll down
      const scrollAmount = Math.round(amount) * 120; // Windows scroll units
      const script = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class ScrollHelper {
    [DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
}
'@
[ScrollHelper]::mouse_event(0x0800, 0, 0, ${scrollAmount}, 0)
`;
      await runPS(script);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  // ─── Keyboard Control ───
  ipcMain.handle('keyboard-type', async (event, text) => {
    try {
      // Escape special characters for SendKeys
      const escaped = text
        .replace(/[+^%~(){}]/g, '{$&}')
        .replace(/'/g, "''");
      await runPS(`$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${escaped}')`);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle('keyboard-press', async (event, key) => {
    try {
      const keyMap = {
        'enter': '{ENTER}', 'tab': '{TAB}', 'escape': '{ESC}', 'esc': '{ESC}',
        'space': ' ', 'backspace': '{BACKSPACE}', 'delete': '{DELETE}', 'del': '{DELETE}',
        'up': '{UP}', 'down': '{DOWN}', 'left': '{LEFT}', 'right': '{RIGHT}',
        'home': '{HOME}', 'end': '{END}', 'pageup': '{PGUP}', 'pagedown': '{PGDN}',
        'f1': '{F1}', 'f2': '{F2}', 'f3': '{F3}', 'f4': '{F4}',
        'f5': '{F5}', 'f6': '{F6}', 'f7': '{F7}', 'f8': '{F8}',
        'f9': '{F9}', 'f10': '{F10}', 'f11': '{F11}', 'f12': '{F12}',
        'insert': '{INSERT}', 'printscreen': '{PRTSC}',
        'capslock': '{CAPSLOCK}', 'numlock': '{NUMLOCK}', 'scrolllock': '{SCROLLLOCK}'
      };
      const mapped = keyMap[key.toLowerCase()] || key;
      await runPS(`$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${mapped}')`);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle('keyboard-hotkey', async (event, combo) => {
    try {
      // Parse combo like 'ctrl+c', 'alt+tab', 'ctrl+shift+s'
      const parts = combo.toLowerCase().split('+').map(p => p.trim());
      let sendKeysStr = '';
      for (const part of parts) {
        if (part === 'ctrl' || part === 'control') sendKeysStr += '^';
        else if (part === 'alt') sendKeysStr += '%';
        else if (part === 'shift') sendKeysStr += '+';
        else {
          // The final key
          const keyMap = {
            'enter': '{ENTER}', 'tab': '{TAB}', 'esc': '{ESC}', 'escape': '{ESC}',
            'space': ' ', 'backspace': '{BS}', 'delete': '{DEL}',
            'up': '{UP}', 'down': '{DOWN}', 'left': '{LEFT}', 'right': '{RIGHT}',
            'home': '{HOME}', 'end': '{END}',
            'f1': '{F1}', 'f2': '{F2}', 'f3': '{F3}', 'f4': '{F4}',
            'f5': '{F5}', 'f6': '{F6}', 'f7': '{F7}', 'f8': '{F8}',
            'f9': '{F9}', 'f10': '{F10}', 'f11': '{F11}', 'f12': '{F12}',
            'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f',
            'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l',
            'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p', 'q': 'q', 'r': 'r',
            's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x',
            'y': 'y', 'z': 'z'
          };
          sendKeysStr += keyMap[part] || part;
        }
      }
      await runPS(`$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${sendKeysStr}')`);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  // ─── Clipboard Control ───
  ipcMain.handle('clipboard-read', async () => {
    try {
      const text = await runPS('Get-Clipboard');
      return { ok: true, content: text };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle('clipboard-write', async (event, text) => {
    try {
      const escaped = text.replace(/'/g, "''");
      await runPS(`Set-Clipboard -Value '${escaped}'`);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  // ─── Screen Info ───
  ipcMain.handle('screen-info', async () => {
    try {
      const info = await runPS(`
Add-Type -AssemblyName System.Windows.Forms
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bounds = $screen.Bounds
$cursor = [System.Windows.Forms.Cursor]::Position
Write-Output "$($bounds.Width)x$($bounds.Height)|$($cursor.X),$($cursor.Y)"
`);
      const [res, pos] = info.split('|');
      const [w, h] = res.split('x').map(Number);
      const [cx, cy] = pos.split(',').map(Number);
      return { ok: true, width: w, height: h, cursorX: cx, cursorY: cy };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  // ─── OS Notification ───
  ipcMain.handle('os-notify', async (event, title, body) => {
    try {
      const { Notification } = require('electron');
      new Notification({ title: title || 'Luna', body: body || '' }).show();
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  });
}

module.exports = { initComputerControl };
