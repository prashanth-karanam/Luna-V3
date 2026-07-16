import re

with open("src/app.js", "r", encoding="utf-8") as f:
    text = f.read()

# Remove the dangling callGroq leftover
# Match from "let allBackupKeys = cfg.groqKeys" to the "}" right before "function updateTokens"
# We'll use a very generous DOTALL match that stops at updateTokens
pattern = r'let allBackupKeys = cfg\.groqKeys.*?\}\n(?=function updateTokens)'
text = re.sub(pattern, '', text, flags=re.DOTALL)

with open("src/app.js", "w", encoding="utf-8") as f:
    f.write(text)

print("Dangling block removed")
