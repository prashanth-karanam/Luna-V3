import re

with open("src/app.js", "r", encoding="utf-8") as f:
    app = f.read()

pattern = r'(\} else if \(parsed\.tool_code\) \{[\s\S]*?\} else if \(parsed\.tool && parsed\.tool !== "NONE"\) \{)'
new_text = '} else if (parsed.tool && parsed.tool !== "NONE") {'

if re.search(pattern, app):
    app = re.sub(pattern, new_text, app)
    with open("src/app.js", "w", encoding="utf-8") as f:
        f.write(app)
    print("Fixed tool_code fallback via Regex!")
else:
    print("Could not find tool_code fallback in app.js via Regex!")
