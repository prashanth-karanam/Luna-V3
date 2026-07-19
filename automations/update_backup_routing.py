import re

with open("src/app.js", "r", encoding="utf-8") as f:
    code = f.read()

# Replace the block that sets url, body, headers
old_block = """    let url, body, headers;
    
    if (key.startsWith('sk-')) {
      // OpenAI
      url = 'https://api.openai.com/v1/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
      body = { model: actualModel, messages: messages, temperature: 0.7 };
    } else if (key.startsWith('gsk_')) {
      // Groq
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
      body = { model: actualModel, messages: messages, temperature: 0.7 };
    } else {
      // Gemini
      url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${key}`;"""

new_block = """    let url, body, headers;
    let requestModel = actualModel;
    
    if (key.startsWith('sk-')) {
      // OpenAI
      if (!requestModel.includes('gpt') && !requestModel.includes('o1')) requestModel = 'gpt-4o-mini';
      url = 'https://api.openai.com/v1/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
      body = { model: requestModel, messages: messages, temperature: 0.7 };
    } else if (key.startsWith('gsk_')) {
      // Groq
      if (!requestModel.includes('llama') && !requestModel.includes('mixtral') && !requestModel.includes('gemma')) requestModel = 'llama-3.1-8b-instant';
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
      body = { model: requestModel, messages: messages, temperature: 0.7 };
    } else {
      // Gemini
      if (!requestModel.includes('gemini')) requestModel = 'gemini-1.5-flash';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${requestModel}:generateContent?key=${key}`;"""

if old_block in code:
    code = code.replace(old_block, new_block)
else:
    print("WARNING: Could not find block to replace!")

with open("src/app.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated backup model routing!")
