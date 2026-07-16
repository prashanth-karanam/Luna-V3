// utils/silentExec.js
// Helper utilities to run external processes without showing a console window.
// All functions hide the Windows terminal (windowsHide:true) and optionally detach.

const { execFile, spawn } = require('child_process');
const path = require('path');

/**
 * Execute a file silently and invoke a callback when it finishes.
 * @param {string} file - Path to executable.
 * @param {string[]} args - Arguments array.
 * @param {(error: Error|null, stdout: string, stderr: string) => void} callback
 */
function silentExec(file, args = [], callback) {
  execFile(file, args, { windowsHide: true }, callback);
}

/**
 * Spawn a process silently. Returns the ChildProcess instance so callers can listen to stdout.
 * @param {string} file - Path to executable (e.g., node).
 * @param {string[]} args - Arguments.
 * @param {object} [options] - Additional spawn options.
 */
function silentSpawn(file, args = [], options = {}) {
  const opts = Object.assign({ windowsHide: true, detached: false }, options);
  const child = spawn(file, args, opts);
  // Ensure the child does not keep the parent alive if detached.
  if (opts.detached) child.unref();
  return child;
}

module.exports = { silentExec, silentSpawn };
