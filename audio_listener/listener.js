// audio_listener/listener.js
// Dummy listener that periodically emits a wake‑up signal.
// In the final version you will replace this with Porcupine wake‑word detection.

setInterval(() => {
  // Emit the string "WAKE" on stdout – the main process will forward it.
  process.stdout.write('WAKE\n');
}, 30000); // every 30 seconds (adjust as needed)
