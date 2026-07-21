const { generateStream } = require('./src/main/LLMRouter.js');

const config = {
  priority: ['gemini', 'groq', 'openai'],
  geminiKey: 'invalid-key-to-trigger-429',
  groqKeys: 'invalid-groq-key1\ninvalid-groq-key2',
  openaiKey: 'invalid-openai-key'
};

const payload = {
  messages: [{ role: 'user', content: 'hello' }],
  systemPrompt: 'You are an AI',
  config: config
};

const callbacks = {
  onToken: (t) => process.stdout.write(t),
  onLog: (l) => console.log('[LOG]', l),
  onError: (e) => console.error('[ERROR]', e.message),
  onEnd: () => console.log('\n[END]')
};

global.fetch = async (url) => {
  return { ok: false, status: 429, text: async () => 'Too Many Requests' };
};

generateStream(payload, callbacks).catch(e => console.error("Fatal:", e));
