import sys

app_path = "src/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "let allBackupKeys = cfg.groqKeys.split" in line:
        skip = True
    if not skip:
        new_lines.append(line)
    if skip and line.strip() == "return reply;}":
        pass
    if skip and "return reply;" in line:
        # Check if the next line is }
        if i + 1 < len(lines) and lines[i+1].strip() == "}":
            skip = False
            # skip the } line as well by letting it run but we already set skip=False. Wait, if skip=False here, it will be added in the next iteration. But the next iteration is }, so it will be added! We need to skip } too.
            # actually it's easier to just do:
    if skip and "updateTokens" in line:
        pass # we stop skipping when we hit updateTokens(count) {

# Better approach:
new_lines = []
skip = False
for line in lines:
    if "let allBackupKeys = cfg.groqKeys.split" in line:
        skip = True
    
    if skip and "function updateTokens(count) {" in line:
        skip = False
        
    if not skip:
        new_lines.append(line)

with open(app_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Block removed via python")
