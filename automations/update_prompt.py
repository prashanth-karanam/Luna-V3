import re

with open("src/app.js", "r", encoding="utf-8") as f:
    code = f.read()

# Add the SEND_MESSAGE instruction
replacement = """- DESKTOP AUTOMATION & MESSAGING:
  * For Messaging (WhatsApp, Instagram, Telegram, Discord, Messenger), ALWAYS use: ${cfg.showThoughts !== false ? '{"thought": "sending message", "tool": "SEND_MESSAGE", "query": "instagram|username|hello"}' : '{"tool": "SEND_MESSAGE", "query": "instagram|username|hello"}'}
  * luna_tools.open_path('C:/path/to/file') - Opens a file or folder directly.
"""

code = code.replace("- DESKTOP AUTOMATION & MESSAGING:\n  * luna_tools.open_path('C:/path/to/file') - Opens a file or folder directly.", replacement)

with open("src/app.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated prompt!")
