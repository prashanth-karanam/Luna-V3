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
    stream: true
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
  const model = config.geminiModel || 'gemini-1.5-flash';
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

async function generateStream(payload, callbacks) {
  const { messages, systemPrompt, config } = payload;
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
        console.log(`[LUNA-ROUTER] Sending request to local Ollama (${config.optMode || config.routerModel || 'phi3:mini'})...`);
        success = await tryOllama(formattedMessages, systemPrompt, config, callbacks);
      } else if (provider === 'gemini' && config.geminiKey) {
        console.log(`[LUNA-ROUTER] Sending request to Gemini (${config.geminiModel || 'gemini-1.5-flash'})...`);
        success = await tryGemini(formattedMessages, systemPrompt, config, callbacks);
      } else if (provider === 'openai' && config.openaiKey) {
        console.log(`[LUNA-ROUTER] Sending request to OpenAI (${config.openaiModel || 'gpt-4o-mini'})...`);
        success = await tryOpenAI(formattedMessages, systemPrompt, config, callbacks);
      } else if (provider === 'groq' && config.groqKey) {
        console.log(`[LUNA-ROUTER] Sending request to Groq (${config.groqModel || 'llama-3.1-8b-instant'})...`);
        success = await tryGroq(formattedMessages, systemPrompt, config, callbacks);
      }

      if (success) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[LUNA-ROUTER] ${provider} generated response successfully in ${elapsed}s.`);
        return;
      }
    } catch (e) {
      console.error(`[LLMRouter] ${provider} failed: ${e.message}`);
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
