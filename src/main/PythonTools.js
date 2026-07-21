const { ipcMain } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');

function initPythonTools(appRoot) {
  ipcMain.handle('tars-personality', async (event, { action, text, trait, value }) => {
    return new Promise((resolve) => {
      let args = [action];
      if (action === 'analyze' && text) {
        args.push('"' + text.replace(/"/g, '\\"') + '"');
      } else if (action === 'set') {
        args.push(trait, value);
      }
      
      const cmd = `python "${path.join(appRoot, 'core/personality_engine.py')}" ${args.join(' ')}`;
      exec(cmd, (error, stdout, stderr) => {
        try {
          if (stdout) {
            const json = JSON.parse(stdout.trim());
            resolve(json);
          } else {
            resolve({ error: "No output" });
          }
        } catch(e) {
          resolve({ error: "Parse failed" });
        }
      });
    });
  });

  function runPythonTool(event, scriptName, args) {
    return new Promise((resolve) => {
      const scriptPath = path.join(appRoot, 'tools', scriptName);
      const pythonProc = spawn('python', [scriptPath, ...args], { env: { ...process.env, PYTHONIOENCODING: 'utf8' } });
      
      let finalOutput = '';
      
      pythonProc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (let line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line.trim());
            if (parsed.type === 'progress' && event) {
               event.sender.send('tool-progress', parsed.msg);
            } else {
               // Assume it's the final output if it has 'ok' or 'error'
               if (parsed.ok !== undefined || parsed.error !== undefined) {
                  finalOutput = line;
               }
            }
          } catch(e) {
             // Not JSON, ignore or log
          }
        }
      });
  
      pythonProc.stderr.on('data', (data) => {
        console.error(`Python Tool Error [${scriptName}]:`, data.toString());
      });
  
      pythonProc.on('close', (code) => {
        try {
          if (finalOutput) {
            resolve(JSON.parse(finalOutput));
          } else {
            resolve({ error: `Process exited with code ${code} but no output.` });
          }
        } catch (e) {
          resolve({ error: 'Failed to parse final output.' });
        }
      });
    });
  }

  ipcMain.handle('organize-files', (e, dir) => runPythonTool(e, 'organizer.py', [dir]));
  ipcMain.handle('search-files', (e, query, dir) => runPythonTool(e, 'search.py', [query, dir]));
  ipcMain.handle('inspect-file', (e, filePath) => runPythonTool(e, 'inspector.py', [filePath]));
  ipcMain.handle('read-doc', (e, filePath) => runPythonTool(e, 'doc_reader.py', [filePath]));
  ipcMain.handle('find-duplicates', (e, dir) => runPythonTool(e, 'duplicate_finder.py', [dir]));
  
  // Generic run-python IPC handler for all Python tools
  ipcMain.handle('run-python', (event, scriptName, args) => {
    return runPythonTool(event, scriptName, args || []);
  });
}

module.exports = { initPythonTools };
