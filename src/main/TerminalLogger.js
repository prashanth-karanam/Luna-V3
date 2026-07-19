function startTerminalLogger(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const MAX_LINES = 100;
  let logBuffer = [];

  function broadcastLog(string) {
    if (mainWindow.isDestroyed()) return;
    
    // Clean up terminal escape sequences (colors, etc.)
    const cleanString = string.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    
    // Ignore empty or pure whitespace
    if (cleanString.trim() === '') return;

    mainWindow.webContents.send('terminal-stream', cleanString);
  }

  // Hook process.stdout
  const oldStdoutWrite = process.stdout.write;
  process.stdout.write = function() {
    oldStdoutWrite.apply(process.stdout, arguments);
    if (arguments[0]) broadcastLog(arguments[0].toString());
  };

  // Hook process.stderr
  const oldStderrWrite = process.stderr.write;
  process.stderr.write = function() {
    oldStderrWrite.apply(process.stderr, arguments);
    if (arguments[0]) broadcastLog(arguments[0].toString());
  };
  
  // Initial startup log
  broadcastLog("[LUNA OS] Terminal logger initialized. Listening on stdout/stderr...\n");
}

module.exports = { startTerminalLogger };
