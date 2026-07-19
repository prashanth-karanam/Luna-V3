import re

with open("src/app.js", "r", encoding="utf-8") as f:
    code = f.read()

# Replace the specific block
old_block = """  // ZERO-LATENCY HYBRID ROUTER
  const actionRegex = /\\b(search|open|app|click|type|file|dir|folder|cmd|run|web|google|find|who|what|when|where|why|how|news|latest|score|match|weather|download|install)\\b/i;
  let useGemini = false;
  if (actionRegex.test(lowerQuery) && cfg.geminiKey) {"""

new_block = """  // ZERO-LATENCY HYBRID ROUTER
  const actionRegex = /\\b(search|open|app|click|type|file|dir|folder|cmd|run|web|google|find|who|what|when|where|why|how|news|latest|score|match|weather|download|install)\\b/i;
  let useGemini = false;
  if ((actionRegex.test(lowerQuery) || depth > 0) && cfg.geminiKey) {"""

if old_block in code:
    code = code.replace(old_block, new_block)
else:
    print("Could not find block!")

with open("src/app.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated router!")
