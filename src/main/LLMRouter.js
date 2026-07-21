async function processStream(readableStream, callbacks, parseFn) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep the last incomplete line

      for (const line of lines) {
        if (!line.trim()) continue;
        const text = parseFn(line);
        if (text) {
          if (callbacks.onToken) callbacks.onToken(text);
        }
      }
    }
    if (buffer.trim()) {
      const text = parseFn(buffer);
      if (text && callbacks.onToken) callbacks.onToken(text);
    }
    if (callbacks.onEnd) callbacks.onEnd();
    return true;
  } catch (e) {
    throw e;
  }
}

async function processSSE(readableStream, callbacks, parseFn) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep the last incomplete line

      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            const text = parseFn(data);
            if (text) {
              if (callbacks.onToken) callbacks.onToken(text);
            }
          } catch(e) {
            // ignore JSON parse error on incomplete chunks
          }
        }
      }
    }
    if (callbacks.onEnd) callbacks.onEnd();
    return true;
  } catch (e) {
    throw e;
  }
}

async function tryOllama(messages, systemPrompt, config, callbacks) {
  const url = 'http://127.0.0.1:11434/api/chat';
  const ollamaMessages = [];
  if (systemPrompt) ollamaMessages.push({ role: 'system', content: systemPrompt });
  messages.forEach(m => ollamaMessages.push({ role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const body = {
    model: config.optMode || config.routerModel || 'phi3:mini',
    messages: ollamaMessages,
    stream: true,
    options: {
      stop: ["---", "### Instruction", "User:", "<|end|>"]
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 120s connection timeout to allow model loading

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  
  clearTimeout(timeout);

  if (!response.ok) throw new Error(`Ollama returned status ${response.status}`);
  
  return await processStream(response.body, callbacks, (chunkStr) => {
    try {
      const parsed = JSON.parse(chunkStr);
      return parsed.message?.content || '';
    } catch(e) {
      return '';
    }
  });
}

async function tryGemini(messages, systemPrompt, config, callbacks) {
  const model = config.geminiModel || 'gemini-3.1-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.geminiKey}`;
  
  const contents = [];
  if (systemPrompt) contents.push({ role: 'user', parts: [{ text: "SYSTEM_PROMPT: " + systemPrompt + "\n\nUnderstood." }]});
  messages.forEach(m => contents.push({ role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const body = { 
    contents, 
    generationConfig: { temperature: 0.7 },
    tools: [{ googleSearch: {} }]
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  
  clearTimeout(timeout);

  if (!response.ok) throw new Error(`Gemini returned status ${response.status}`);

  return await processSSE(response.body, callbacks, (data) => {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  });
}

async function tryOpenAI(messages, systemPrompt, config, callbacks) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const formatted = [];
  if (systemPrompt) formatted.push({ role: 'system', content: systemPrompt });
  messages.forEach(m => formatted.push({ role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const body = {
    model: config.openaiModel || 'gpt-4o-mini',
    messages: formatted,
    temperature: 0.7,
    stream: true
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.openaiKey}` },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  
  clearTimeout(timeout);

  if (!response.ok) throw new Error(`OpenAI returned status ${response.status}`);

  return await processSSE(response.body, callbacks, (data) => {
    return data?.choices?.[0]?.delta?.content || '';
  });
}

async function tryGroq(messages, systemPrompt, config, callbacks) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const formatted = [];
  if (systemPrompt) formatted.push({ role: 'system', content: systemPrompt });
  messages.forEach(m => formatted.push({ role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const body = {
    model: config.groqModel || 'llama-3.1-8b-instant',
    messages: formatted,
    temperature: 0.7,
    stream: true
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.groqKey}` },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  
  clearTimeout(timeout);

  if (!response.ok) throw new Error(`Groq returned status ${response.status}`);

  return await processSSE(response.body, callbacks, (data) => {
    return data?.choices?.[0]?.delta?.content || '';
  });
}

async function tryOpenRouter(messages, systemPrompt, config, callbacks) {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const formatted = [];
  if (systemPrompt) formatted.push({ role: 'system', content: systemPrompt });
  messages.forEach(m => formatted.push({ role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const body = {
    model: config.openRouterModel || 'anthropic/claude-3.5-sonnet',
    messages: formatted,
    temperature: 0.7,
    stream: true
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${config.openRouterKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Luna OS'
    },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  
  clearTimeout(timeout);

  if (!response.ok) throw new Error(`OpenRouter returned status ${response.status}`);

  return await processSSE(response.body, callbacks, (data) => {
    return data?.choices?.[0]?.delta?.content || '';
  });
}

async function tryHuggingFace(messages, systemPrompt, config, callbacks) {
  // HuggingFace Inference API (Serverless) using text-generation or chat-completion format
  // We'll use the chat/completions route available on many models on HF
  const url = `https://api-inference.huggingface.co/models/${config.hfModel || 'mistralai/Mistral-7B-Instruct-v0.2'}/v1/chat/completions`;
  const formatted = [];
  if (systemPrompt) formatted.push({ role: 'system', content: systemPrompt });
  messages.forEach(m => formatted.push({ role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const body = {
    model: config.hfModel || 'mistralai/Mistral-7B-Instruct-v0.2',
    messages: formatted,
    temperature: 0.7,
    stream: true,
    max_tokens: 1500
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${config.hfKey}` 
    },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  
  clearTimeout(timeout);

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`HuggingFace returned status ${response.status}: ${txt}`);
  }

  return await processSSE(response.body, callbacks, (data) => {
    return data?.choices?.[0]?.delta?.content || '';
  });
}

let poolIndexGemini = 0;
let poolIndexOpenAI = 0;
let poolIndexGroq = 0;

async function generateStream(payload, callbacks) {
  const { messages, systemPrompt, config } = payload;
  
  // Sanitize all API keys to remove accidental spaces or newlines (prevents fetch Header errors)
  const sanitizeKey = (k) => k ? k.replace(/\s+/g, '') : k;
  config.geminiKey = sanitizeKey(config.geminiKey);
  config.openaiKey = sanitizeKey(config.openaiKey);
  config.groqKey = sanitizeKey(config.groqKey);
  config.openRouterKey = sanitizeKey(config.openRouterKey);
  config.hfKey = sanitizeKey(config.hfKey);

  const priority = config.priority || ['ollama', 'gemini', 'openai', 'groq'];
  
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content || m.text || ''
  }));

  let lastError = null;

  for (const provider of priority) {
    try {
      const startTime = Date.now();
      let success = false;

      if (provider === 'ollama') {
        const msg = `[LUNA-ROUTER] Sending request to local Ollama (${config.optMode || config.routerModel || 'phi3:mini'})...`;
        console.log(msg);
        if (callbacks.onLog) callbacks.onLog(msg);
        success = await tryOllama(formattedMessages, systemPrompt, config, callbacks);
      } else if (provider === 'gemini') {
        const geminiPool = (config.geminiKeys ? config.geminiKeys.split(/[,\n]/) : [config.geminiKey]).map(k => sanitizeKey(k)).filter(k => k);
        const startIdx = poolIndexGemini % geminiPool.length || 0;
        for (let offset = 0; offset < geminiPool.length; offset++) {
          let i = (startIdx + offset) % geminiPool.length;
          config.geminiKey = geminiPool[i];
          try {
            const msg = `[LUNA-ROUTER] Sending request to Gemini (${config.geminiModel || 'gemini-2.5-flash'}) [Key ${i+1}/${geminiPool.length}]...`;
            console.log(msg);
            if (callbacks.onLog) callbacks.onLog(msg);
            success = await tryGemini(formattedMessages, systemPrompt, config, callbacks);
            if (success) { poolIndexGemini = i; break; }
          } catch (e) {
            if ((e.message.includes('429') || e.message.includes('400') || e.message.includes('401')) && offset < geminiPool.length - 1) {
              const msg = `[LLMRouter] Gemini Key ${i+1} failed (${e.message}). Rotating to next...`;
              console.warn(msg);
              if (callbacks.onLog) callbacks.onLog(msg);
            } else {
              throw e; // Throw to the outer loop to trigger fallback to Groq/OpenAI
            }
          }
        }
      } else if (provider === 'openai') {
        const openaiPool = (config.openaiKeys ? config.openaiKeys.split(/[,\n]/) : [config.openaiKey]).map(k => sanitizeKey(k)).filter(k => k);
        const startIdx = poolIndexOpenAI % openaiPool.length || 0;
        for (let offset = 0; offset < openaiPool.length; offset++) {
          let i = (startIdx + offset) % openaiPool.length;
          config.openaiKey = openaiPool[i];
          try {
            const msg = `[LUNA-ROUTER] Sending request to OpenAI (${config.openaiModel || 'gpt-4o-mini'}) [Key ${i+1}/${openaiPool.length}]...`;
            console.log(msg);
            if (callbacks.onLog) callbacks.onLog(msg);
            success = await tryOpenAI(formattedMessages, systemPrompt, config, callbacks);
            if (success) { poolIndexOpenAI = i; break; }
          } catch (e) {
            if ((e.message.includes('429') || e.message.includes('401')) && offset < openaiPool.length - 1) {
              const msg = `[LLMRouter] OpenAI Key ${i+1} failed (${e.message}). Rotating to next...`;
              console.warn(msg);
              if (callbacks.onLog) callbacks.onLog(msg);
            } else {
              throw e;
            }
          }
        }
      } else if (provider === 'groq') {
        // Find all Groq keys even if they span multiple lines or are separated by spaces/newlines
        let groqPool = config.groqKeys ? (config.groqKeys.match(/gsk_[a-zA-Z0-9_-]+/g) || config.groqKeys.split(/[,\n]/)) : [config.groqKey];
        groqPool = groqPool.map(k => sanitizeKey(k)).filter(k => k);
        const startIdx = poolIndexGroq % groqPool.length || 0;
        for (let offset = 0; offset < groqPool.length; offset++) {
          let i = (startIdx + offset) % groqPool.length;
          config.groqKey = groqPool[i];
          try {
            const msg = `[LUNA-ROUTER] Sending request to Groq (${config.groqModel || 'llama-3.1-8b-instant'}) [Key ${i+1}/${groqPool.length}]...`;
            console.log(msg);
            if (callbacks.onLog) callbacks.onLog(msg);
            success = await tryGroq(formattedMessages, systemPrompt, config, callbacks);
            if (success) { poolIndexGroq = i; break; }
          } catch (e) {
            if ((e.message.includes('429') || e.message.includes('401')) && offset < groqPool.length - 1) {
              const msg = `[LLMRouter] Groq Key ${i+1} failed (${e.message}). Rotating to next...`;
              console.warn(msg);
              if (callbacks.onLog) callbacks.onLog(msg);
            } else {
              throw e;
            }
          }
        }
      } else if (provider === 'openrouter' && config.openRouterKey) {
        const msg = `[LUNA-ROUTER] Sending request to OpenRouter (${config.openRouterModel})...`;
        console.log(msg);
        if (callbacks.onLog) callbacks.onLog(msg);
        success = await tryOpenRouter(formattedMessages, systemPrompt, config, callbacks);
      } else if (provider === 'huggingface' && config.hfKey) {
        const msg = `[LUNA-ROUTER] Sending request to HuggingFace (${config.hfModel})...`;
        console.log(msg);
        if (callbacks.onLog) callbacks.onLog(msg);
        success = await tryHuggingFace(formattedMessages, systemPrompt, config, callbacks);
      }

      if (success) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const msg = `[LUNA-ROUTER] ${provider} generated response successfully in ${elapsed}s.`;
        console.log(msg);
        if (callbacks.onLog) callbacks.onLog(msg);
        return;
      }
    } catch (e) {
      const msg = `[LLMRouter] ${provider} failed: ${e.message}. Trying next available provider...`;
      console.error(msg);
      if (callbacks.onLog) callbacks.onLog(msg);
      lastError = e;
    }
  }

  if (callbacks.onError) {
    callbacks.onError(new Error(lastError ? lastError.message : 'All API providers failed or are not configured.'));
  }
}

module.exports = {
  generateStream
};

