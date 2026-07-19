const { ipcMain, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

class CodeRunner {
  constructor() {
    this.runners = new Map(); // language -> { process, buffer, running }
    this.maxOutput = 3000;
    this.timeout = 60000; // 60 seconds
  }

  startSession(language) {
    if (this.runners.has(language) && this.runners.get(language).process && !this.runners.get(language).process.killed) {
      return; // Session already running
    }

    let cmd, args, shell;
    switch (language) {
      case 'python':
        cmd = 'python';
        args = ['-u', '-i', '-q']; // unbuffered, interactive, quiet
        shell = false;
        break;
      case 'javascript':
        cmd = 'node';
        args = ['-i'];
        shell = false;
        break;
      case 'shell':
        cmd = 'cmd.exe';
        args = [];
        shell = true;
        break;
      case 'powershell':
        cmd = 'powershell.exe';
        args = ['-NoLogo', '-NoProfile', '-Command', '-'];
        shell = false;
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    const proc = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: shell,
      windowsHide: true,
      env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONDONTWRITEBYTECODE: '1', PYTHONIOENCODING: 'utf-8' }
    });

    this.runners.set(language, {
      process: proc,
      buffer: '',
      running: false,
      timeoutId: null
    });

    return proc;
  }

  async execute(language, code, win) {
    this.startSession(language);
    const runner = this.runners.get(language);
    if (!runner || !runner.process || runner.process.killed) {
      return { ok: false, error: 'Failed to start session for ' + language };
    }

    runner.buffer = '';
    runner.running = true;

    // Use a unique end marker to detect when execution finishes
    const endMarker = `__LUNA_EXEC_DONE_${Date.now()}__`;

    return new Promise((resolve) => {
      let output = '';
      let truncated = false;

      const onData = (data) => {
        const text = data.toString();
        
        if (text.includes(endMarker)) {
          // Execution complete
          const cleanText = text.replace(endMarker, '').replace(new RegExp(`.*${endMarker}.*\\n?`), '');
          if (cleanText.trim()) {
            output += cleanText;
            if (win && !win.isDestroyed()) {
              win.webContents.send('code-output', { type: 'stdout', content: cleanText, language });
            }
          }
          cleanup();
          runner.running = false;
          if (output.length > this.maxOutput) {
            output = output.substring(0, this.maxOutput) + '\n... (output truncated)';
          }
          resolve({ ok: true, output: output.trim() || '(no output)' });
          return;
        }

        if (!truncated) {
          output += text;
          if (output.length > this.maxOutput) {
            truncated = true;
          }
          if (win && !win.isDestroyed()) {
            win.webContents.send('code-output', { type: 'stdout', content: text, language });
          }
        }
      };

      const onError = (data) => {
        const text = data.toString();
        // Filter out REPL prompts
        const clean = text.replace(/^>>> /gm, '').replace(/^\.\.\. /gm, '').replace(/^> /gm, '').trim();
        if (clean && !clean.includes(endMarker)) {
          output += clean + '\n';
          if (win && !win.isDestroyed()) {
            win.webContents.send('code-output', { type: 'stderr', content: clean, language });
          }
        }
      };

      const cleanup = () => {
        runner.process.stdout.removeListener('data', onData);
        runner.process.stderr.removeListener('data', onError);
        if (runner.timeoutId) {
          clearTimeout(runner.timeoutId);
          runner.timeoutId = null;
        }
      };

      runner.process.stdout.on('data', onData);
      runner.process.stderr.on('data', onError);

      // Timeout protection
      runner.timeoutId = setTimeout(() => {
        cleanup();
        runner.running = false;
        resolve({ ok: false, output: output, error: 'Execution timed out after ' + (this.timeout / 1000) + 's' });
      }, this.timeout);

      // Write the code to the subprocess stdin
      let wrappedCode;
      switch (language) {
        case 'python':
          // Wrap in exec() to handle multi-line code, then print end marker
          const escaped = code.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          wrappedCode = `import sys, os\nsys.path.append(os.path.abspath('core'))\nexec('''${escaped}''')\nprint('${endMarker}')\n`;
          break;
        case 'javascript':
          wrappedCode = `${code}\nconsole.log('${endMarker}')\n`;
          break;
        case 'shell':
          wrappedCode = `${code}\necho ${endMarker}\n`;
          break;
        case 'powershell':
          wrappedCode = `${code}\nWrite-Output '${endMarker}'\n`;
          break;
      }

      runner.process.stdin.write(wrappedCode);
    });
  }

  stopExecution(language) {
    if (language) {
      const runner = this.runners.get(language);
      if (runner && runner.process && !runner.process.killed) {
        runner.process.kill('SIGINT');
        runner.running = false;
      }
    } else {
      // Stop all
      for (const [lang, runner] of this.runners) {
        if (runner.process && !runner.process.killed) {
          runner.process.kill('SIGINT');
          runner.running = false;
        }
      }
    }
    return { ok: true };
  }

  killSession(language) {
    const runner = this.runners.get(language);
    if (runner && runner.process && !runner.process.killed) {
      runner.process.kill('SIGKILL');
    }
    this.runners.delete(language);
    return { ok: true };
  }

  getStatus() {
    const status = {};
    for (const [lang, runner] of this.runners) {
      status[lang] = {
        alive: runner.process && !runner.process.killed,
        running: runner.running
      };
    }
    return status;
  }

  killAll() {
    for (const [lang] of this.runners) {
      this.killSession(lang);
    }
  }
}

function initCodeRunner() {
  const runner = new CodeRunner();

  ipcMain.handle('code-execute', async (event, language, code) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return runner.execute(language, code, win);
  });

  ipcMain.handle('code-stop', async (event, language) => {
    return runner.stopExecution(language);
  });

  ipcMain.handle('code-kill', async (event, language) => {
    return runner.killSession(language);
  });

  ipcMain.handle('code-status', async () => {
    return runner.getStatus();
  });

  // Cleanup on app quit
  const { app } = require('electron');
  app.on('before-quit', () => {
    runner.killAll();
  });

  return runner;
}

module.exports = { initCodeRunner };
