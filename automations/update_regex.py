with open("src/app.js", "r", encoding="utf-8") as f:
    app = f.read()

old_regex = r"const actionRegex = /\b(search|open|app|click|type|file|dir|folder|cmd|run|web|google|find|who|what|when|where|why|how|news|latest|score|match|weather|download|install)\b/i;"
new_regex = r"const actionRegex = /\b(search|open|app|click|type|file|dir|folder|cmd|run|web|google|find|who|what|when|where|why|how|news|latest|score|match|weather|download|install|send|message|dm|whatsapp|instagram|insta|telegram|discord|email|mail)\b/i;"

if old_regex in app:
    app = app.replace(old_regex, new_regex)
    with open("src/app.js", "w", encoding="utf-8") as f:
        f.write(app)
    print("Fixed action regex!")
else:
    print("Could not find old regex in app.js!")
