# Luna AI - Web OS

Luna is an autonomous desktop AI assistant featuring a hybrid AI routing engine, direct desktop computer control, and local/cloud fallback handling. 

This repository has been cleaned up and streamlined to focus on the core, functional components:
- **Zero-Latency Hybrid Router**: Fast API routing across local (Ollama) and cloud (Gemini, OpenAI, Groq) models.
- **Computer Control**: Real OS interaction using PowerShell via Electron IPC.
- **Web Automation**: Reliable DOM extraction and browser manipulation via Playwright.

## 🚀 Tech Stack
- **Frontend / UI**: HTML, Vanilla JS, CSS (Electron)
- **Backend Bridge**: Node.js (Electron IPC)
- **Automation / Tools**: Python (Playwright, PyAutoGUI, etc.)

## 🛠️ Installation & Setup

1. **Install Node Dependencies**
   `ash
   npm install
   `

2. **Install Python Dependencies**
   Luna requires several Python libraries for automation and browser control.
   `ash
   pip install -r tools/requirements.txt
   playwright install chromium
   `

3. **Start Luna**
   `ash
   npm start
   `
   *(Alternatively, double-click oot.bat on Windows)*

## 🧠 Architecture
- src/ : Frontend UI components and Brain logic (pp.js)
- src/main/ : Electron IPC Handlers (LLMRouter.js, ComputerControl.js, etc.)
- core/ : Inline Python modules (luna_tools.py, luna_message.py)
- 	ools/ : IPC-driven Python automation scripts
- ui/ : CSS styling

---
*Cleaned and optimized version of Luna V3.*
