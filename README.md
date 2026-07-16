# 🌙 Luna V3 - Advanced Hybrid AI Assistant
**Submission for OpenAI Build Week**

Luna is a highly advanced, fully autonomous desktop AI assistant.

> [!NOTE] 
> **Important Note for Hackathon Judges:**
> The baseline UI shell (IDE, Wallpaper Manager, Voice Mode UI) is ported from my previous personal "Luna V2" project. However, the **entire AI Engine, Brain Architecture, and Automation Stack** was engineered from scratch exclusively during this Hackathon timeline, orchestrated with the assistance of GPT Codex 5.6.

## 🚀 Hackathon Features (Built during this event)

### 1. Zero-Latency Hybrid Router
Luna features a completely custom, lightning-fast regex routing engine built in JavaScript. 
- **Casual Chat:** Instantly routes conversational prompts to **Local Ollama** (running Llama 3.2 3B or Qwen) for zero-latency, zero-cost responses.
- **Complex Automation:** Instantly intercepts action-verbs (`search`, `run`, `click`) and routes the prompt directly to **OpenAI / GPT-4o** for heavy-duty desktop automation.

### 2. Cloud Grounded Search (`[SILENT_SEARCH]`)
We integrated Google's state-of-the-art Grounded Search API directly into Luna's Python backend. Luna can now pull live sports widgets, real-time weather, and news facts instantly, bypassing the need for slow headless browsers.

### 3. Chromium Playwright Fallback (`[WEB_SEARCH]`)
If the user asks to scrape a specific non-Google URL, or if the Grounding API fails to find a specific number, Luna automatically falls back to spinning up a Playwright Chromium browser instance to physically scrape the DOM.

### 4. Admin API Pool Rotation
To prevent rate-limiting during heavy scraping and automation, Luna connects to a Firebase backend to pull a pool of 4-5 active API keys. The engine natively shuffles through these keys dynamically during heavy usage.

### 5. Local Llama Personality Optimization (The "Pink Elephant" Fix)
We solved the classic robotic-personality issue found in heavily instruction-tuned small parameter models (like Llama 3) by overhauling the system prompt with Positive Framing and optimizing the `num_ctx` window down to 4096 for massive speed boosts on local hardware.

## 🛠️ Tech Stack
- **Frontend/UI**: HTML, Vanilla JS, CSS
- **Backend Bridge**: Electron IPC
- **Automation Execution**: Python (`luna_tools.py`, Playwright, PyAutoGUI)
- **Local Inference**: Ollama API
- **Cloud Inference**: OpenAI / GPT-4o API & Groq API

## ⚙️ Installation & Setup
To run Luna V3 from source, please follow these steps carefully:

### Prerequisites
1. **Node.js**: Install from [nodejs.org](https://nodejs.org/) (Required for the Electron UI bridge).
2. **Python 3.10+**: Install from [python.org](https://www.python.org/) (Required for the backend OS automation engine). Ensure Python is added to your PATH.
3. **Ollama (Optional but Recommended)**: Install from [ollama.com](https://ollama.com/) to run the local zero-latency AI models (`qwythos-9b` or `minicpm-v`).

### 1. Install Node Dependencies
Open your terminal in the root folder and install the UI dependencies:
```bash
npm install
```

### 2. Install Python Dependencies
Luna relies on several Python libraries to physically control your computer, scrape the web, and listen to your voice. Run this command:
```bash
pip install pyautogui pillow pygetwindow opencv-python requests beautifulsoup4 SpeechRecognition pyaudio pyttsx3 playwright
```
*Note: If you plan to use Playwright for web scraping, also run: `playwright install chromium`*

### 3. Boot Luna
Once dependencies are installed, you can launch the OS with:
```bash
npm start
```
*(Alternatively, you can just double-click `boot.bat` on Windows)*

### 4. Configuration (Settings)
When the Luna UI opens, click the **Settings** gear:
- **Local Mode**: If you have Ollama running, toggle "Use Local Model".
- **Cloud Automation**: To use OpenAI Cloud for heavy automation tasks, paste your OpenAI or Cloud API key in the advanced settings.
- **Alias Storage**: Map your contacts (e.g., "Best Friend") to their social media handles using the Aliases tab.

---
*Created by Sai Prashant for OpenAI Build Week.*
