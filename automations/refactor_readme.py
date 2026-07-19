import sys

readme_path = "README.md"
with open(readme_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace Gemini mentions
text = text.replace("Gemini 2.5 Flash", "OpenAI / GPT-4o")
text = text.replace("Gemini Grounded Search", "Cloud Grounded Search")
text = text.replace("Gemini API key", "OpenAI or Cloud API key")
text = text.replace("Gemini API", "OpenAI API")
text = text.replace("Gemini for heavy-duty desktop automation", "OpenAI (GPT-4o) for heavy-duty desktop automation")
text = text.replace("Gemini", "OpenAI Cloud")

with open(readme_path, "w", encoding="utf-8") as f:
    f.write(text)

print("README updated")
