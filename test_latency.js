const { generateStream } = require('./src/main/LLMRouter');
const config = {
  optMode: 'phi3:mini',
  priority: ['ollama']
};
const payload = {
  messages: [{ role: 'user', content: 'hi' }],
  systemPrompt: '[IDENTITY]: You are Luna...',
  config: config
};

console.log("Starting test...");
const start = Date.now();
generateStream(payload, {
  onToken: (t) => process.stdout.write(t),
  onEnd: () => {
    console.log(`\n\n[SUCCESS] Total Latency Time: ${Date.now() - start}ms`);
  },
  onError: (e) => console.error(e)
});
