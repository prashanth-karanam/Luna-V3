import sys
import re

app_path = "src/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()

# Delete trackFirebaseMessage
firebase_regex = r'async function trackFirebaseMessage\(\) \{.*?\n\}\n'
app_js = re.sub(firebase_regex, '', app_js, flags=re.DOTALL)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_js)

print("Firebase tracking removed")
