import re

with open("src/app.js", "r", encoding="utf-8") as f:
    code = f.read()

# Fix SEND_MESSAGE json string to include 'response' key
old_str = r"`" + r"""- DESKTOP AUTOMATION & MESSAGING:
  * For Messaging (WhatsApp, Instagram, Telegram, Discord, Messenger), ALWAYS use: ${cfg.showThoughts !== false ? '{"thought": "sending message", "tool": "SEND_MESSAGE", "query": "instagram|username|hello"}' : '{"tool": "SEND_MESSAGE", "query": "instagram|username|hello"}'}"""
  
new_str = r"`" + r"""- DESKTOP AUTOMATION & MESSAGING:
  * For Messaging (WhatsApp, Instagram, Telegram, Discord, Messenger), ALWAYS use: ${cfg.showThoughts !== false ? '{"thought": "sending", "response": "Sending message now", "tool": "SEND_MESSAGE", "query": "instagram|username|hello"}' : '{"response": "Sending message now", "tool": "SEND_MESSAGE", "query": "instagram|username|hello"}'}"""

code = code.replace(old_str[1:], new_str[1:])

# Add a rule to prevent meta-commentary
old_rule = "  RULE 3: Be ultra-concise. Give exactly the answer requested without huge paragraphs of unnecessary details."
new_rule = "  RULE 3: Be ultra-concise. Give exactly the answer requested without huge paragraphs of unnecessary details.\n  RULE 4: NEVER explain your internal system mechanisms, how you sent a message, or what tools you used. Just execute them silently."

code = code.replace(old_rule, new_rule)

with open("src/app.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated SEND_MESSAGE format and added RULE 4!")
