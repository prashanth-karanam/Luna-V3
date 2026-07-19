with open("src/app.js", "r", encoding="utf-8") as f:
    app = f.read()

old_block = """          if (parsed.tool === "EXECUTE_PYTHON" && parsed.code) {
              reconstructed += `[EXECUTE_PYTHON]\\n${parsed.code}\\n[/EXECUTE_PYTHON]`;
          } else if (parsed.tool_code) {
              reconstructed += `[EXECUTE_PYTHON]\\n${parsed.tool_code}\\n[/EXECUTE_PYTHON]`;
          } else if (parsed.tool && parsed.tool !== "NONE") {"""

new_block = """          if (parsed.tool === "EXECUTE_PYTHON" && parsed.code) {
              reconstructed += `[EXECUTE_PYTHON]\\n${parsed.code}\\n[/EXECUTE_PYTHON]`;
          } else if (parsed.tool && parsed.tool !== "NONE") {"""

if old_block in app:
    app = app.replace(old_block, new_block)
    with open("src/app.js", "w", encoding="utf-8") as f:
        f.write(app)
    print("Fixed tool_code fallback!")
else:
    print("Could not find tool_code fallback in app.js!")
