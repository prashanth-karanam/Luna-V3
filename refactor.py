import re
import os

APP_JS = "src/app.js"
INDEX_HTML = "index.html"

# 1. Refactor app.js
with open(APP_JS, 'r', encoding='utf-8') as f:
    app_code = f.read()

# Add fetchWithTimeout at the top
fetch_wrapper = """
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 15000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}
"""

if "async function fetchWithTimeout" not in app_code:
    app_code = fetch_wrapper + "\n" + app_code

# Replace fetch calls with fetchWithTimeout, EXCEPT the one inside fetchWithTimeout itself
app_code = re.sub(r'(?<!await )fetch\(', 'fetchWithTimeout(', app_code)
# Fix the one inside the wrapper
app_code = app_code.replace('await fetchWithTimeout(resource, {', 'await fetch(resource, {')

# Fix Gemini res.ok check
gemini_bug_str = """
  const res = await fetchWithTimeout(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
"""
gemini_fix_str = """
  const res = await fetchWithTimeout(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error: ${res.status} ${errText}`);
  }
  const data = await res.json();
"""
app_code = app_code.replace(gemini_bug_str, gemini_fix_str)

# Fix Groq res.ok check
groq_bug_str = """
  const res = await fetchWithTimeout(`${GROQ_BASE}/chat/completions`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelOverride || cfg.groqModel, messages, temperature: 0.7 }),
  });
  const data = await res.json();
"""
groq_fix_str = """
  const res = await fetchWithTimeout(`${GROQ_BASE}/chat/completions`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelOverride || cfg.groqModel, messages, temperature: 0.7 }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API Error: ${res.status} ${errText}`);
  }
  const data = await res.json();
"""
app_code = app_code.replace(groq_bug_str, groq_fix_str)


# Remove WebSocket logic
ws_code_pattern = r'let backendSocket = null;.*?function connectBackend\(\) \{.*?\n\}\nconnectBackend\(\);\n'
app_code = re.sub(ws_code_pattern, '', app_code, flags=re.DOTALL)

# In callAI, remove the local socket routing and route local AI to callOllama then parseAICommands
local_routing_old = """
    // Route to Local Model
    if (useLocalModel || forceLocal) {
        if (!backendSocket || backendSocket.readyState !== WebSocket.OPEN) {
            connectBackend();
            return "<div style='color:red;'>⚠️ Local backend is disconnected. Reconnecting... Try again in a moment.</div>";
        }
        
        return new Promise((resolve) => {
            window.resolveLocalAI = resolve;
            
            // Format for python backend
            const payload = {
                type: "chat",
                text: joinedText,
                model: cfg.routerModel || "qwythos-9b"
            };
            
            backendSocket.send(JSON.stringify(payload));
        });
    }
"""
local_routing_new = """
    // Route to Local Model
    if (useLocalModel || forceLocal) {
        const reply = await callOllama(joinedText);
        const cleanReply = await parseAICommands(reply, depth, failCount);
        if (cleanReply && cleanReply !== reply && typeof cleanReply === 'string' && !cleanReply.startsWith("[SYSTEM]")) {
            return cleanReply;
        }
        return cleanReply;
    }
"""
app_code = app_code.replace(local_routing_old, local_routing_new)

# Clean up broken bold regex in formatText
app_code = app_code.replace(".replace(/\\*\\*(.*?)\\*\\*/g, '<strong></strong>')", ".replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')")

# Fix `processVoiceChat` reference error
app_code = app_code.replace("const clean = await parseAICommands(reply, depth, failCount);", "const clean = await parseAICommands(reply, 0, 0);")

# Save app.js
with open(APP_JS, 'w', encoding='utf-8') as f:
    f.write(app_code)


# 2. Extract Modals from index.html
with open(INDEX_HTML, 'r', encoding='utf-8') as f:
    html_code = f.read()

# We will just remove the modals from index.html that are placed AFTER </html>
# And also remove them from within the body to put them in a JS file.
# To keep this script robust, we will just fix the </html> issue and remove duplicate </body></html>
html_code = html_code.replace("</body>\n</html>\n\n\n\n  <!-- ─── LOCAL DIAGNOSTICS MODAL ─── -->", "  <!-- ─── LOCAL DIAGNOSTICS MODAL ─── -->")
html_code = html_code.replace("  </div>\n</body>\n</html>", "  </div>")

if not html_code.endswith("</body>\n</html>"):
    html_code += "\n</body>\n</html>"

with open(INDEX_HTML, 'w', encoding='utf-8') as f:
    f.write(html_code)

print("Refactor complete.")
