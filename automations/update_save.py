import re

with open("src/app.js", "r", encoding="utf-8") as f:
    code = f.read()

old_block = """if ($('saveSettings')) $('saveSettings').addEventListener('click', () => {
  cfg.geminiKey = $('geminiKey').value.trim();
  cfg.geminiKeys = $('geminiKeys') ? $('geminiKeys').value.trim() : '';
  cfg.geminiModel = $('geminiModel').value;"""

new_block = """if ($('saveSettings')) $('saveSettings').addEventListener('click', () => {
  cfg.geminiKey = ($('masterApiKey') && $('masterApiKey').value.trim() !== '') ? $('masterApiKey').value.trim() : $('geminiKey').value.trim();
  cfg.geminiKeys = ($('masterApiPool') && $('masterApiPool').value.trim() !== '') ? $('masterApiPool').value.trim() : ($('geminiKeys') ? $('geminiKeys').value.trim() : '');
  cfg.geminiModel = ($('masterApiModel') && $('masterApiModel').value.trim() !== '') ? $('masterApiModel').value : $('geminiModel').value;"""

if old_block in code:
    code = code.replace(old_block, new_block)
else:
    print("Could not find block!")

with open("src/app.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated saveSettings!")
