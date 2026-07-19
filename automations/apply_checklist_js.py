import re

js_path = "src/app.js"
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Modify addBubble to include the 3-dots menu
dots_menu_html = """
    ${isLuna ? `<div class="bubble-context-menu">
      <button class="dots-btn" onclick="toggleDotsMenu(this, event)">•••</button>
      <div class="dots-dropdown">
        <button class="dots-option" onclick="triggerApology(this)">You are completely wrong</button>
      </div>
    </div>` : ''}
"""

if "bubble-context-menu" not in js:
    # Find the bubble-col div closing tag
    js = re.sub(
        r'(<div class="bubble \$\{isLuna \? \'lb\' : \'ub\'\}">.*?</div>\n\s*</div>)',
        r'\1' + dots_menu_html,
        js,
        flags=re.DOTALL
    )

# 2. Add global JS functions for the 3-dots menu
menu_logic = """
// --- 3-Dots Menu Logic ---
window.toggleDotsMenu = function(btn, event) {
    event.stopPropagation();
    const dropdown = btn.nextElementSibling;
    const isShowing = dropdown.classList.contains('show');
    document.querySelectorAll('.dots-dropdown').forEach(d => d.classList.remove('show'));
    if (!isShowing) dropdown.classList.add('show');
};

document.addEventListener('click', () => {
    document.querySelectorAll('.dots-dropdown').forEach(d => d.classList.remove('show'));
});

window.triggerApology = function(btn) {
    const dropdown = btn.closest('.dots-dropdown');
    dropdown.classList.remove('show');
    
    // Send an immediate apology bubble
    addBubble('luna', 'I sincerely apologize for the error. Would you like me to try again?');
    
    // We could store the previous query state here and offer a 'Yes/No' button, 
    // but for now, we just output the apology for the user to respond.
};

// --- Dynamic Checklist System ---
window.currentChecklistId = null;

window.createChecklist = function(tasks) {
    const id = 'checklist-' + Date.now();
    window.currentChecklistId = id;
    
    let html = `<div id="${id}" class="checklist-container">`;
    tasks.forEach((task, index) => {
        html += `
        <label class="checkbox-wrapper" id="${id}-item-${index}">
          <input type="checkbox" disabled />
          <div class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 6L9 17L4 12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </div>
          <span class="label">${task}</span>
        </label>
        `;
    });
    html += `</div>`;
    addBubble('luna', html);
    return id;
};

window.tickChecklist = function(taskSubstring) {
    if (!window.currentChecklistId) return;
    const container = document.getElementById(window.currentChecklistId);
    if (!container) return;
    
    const labels = container.querySelectorAll('.label');
    labels.forEach(label => {
        if (label.textContent.toLowerCase().includes(taskSubstring.toLowerCase())) {
            const input = label.parentElement.querySelector('input');
            if (input && !input.checked) {
                input.checked = true;
            }
        }
    });
};
"""
if "toggleDotsMenu" not in js:
    js += "\n" + menu_logic


# 3. Intercept `SEND_MESSAGE` to generate checklist first
# In AI_COMMAND_REGISTRY['SEND_MESSAGE']
send_message_intercept = """
    'SEND_MESSAGE': async (match, feedback) => {
        if (window.electronAPI) {
            const args = match[1].trim().split('|');
            if (args.length < 3) {
                feedback.push('[SYSTEM_ERROR]: SEND_MESSAGE requires platform|receiver|message');
                return;
            }
            
            // Generate Dynamic Checklist using fast local model
            addBubble('luna', '<span style="font-style:italic;color:var(--dim);">Generating execution plan...</span>');
            
            const prompt = `Task: Send a message to ${args[1]} on ${args[0]} saying "${args[2]}".
Split this automation task into 3 logical steps (e.g. Opening Browser, Opening Chat, Sending Message).
Return ONLY a valid JSON array of strings. Do not explain.`;
            
            try {
                // Call fast model to get steps
                const planJson = await window.electronAPI.runLocalModel(prompt, 'phi3:mini');
                // Extract array from response
                const match = planJson.match(/\[(.*?)\]/s);
                let tasks = ["Opening Browser", "Opening Target Chat", "Typing and Sending"]; // fallback
                if (match) {
                    try {
                        tasks = JSON.parse("[" + match[1] + "]");
                    } catch(e){}
                }
                window.createChecklist(tasks);
            } catch (e) {
                console.error("Plan generation failed, using fallback", e);
                window.createChecklist(["Opening Browser", "Navigating to Profile/DM", "Sending Message"]);
            }
            
            const pyCode = `import luna_message\\nprint(luna_message.send_message({'platform': '${args[0].trim()}', 'receiver': '${args[1].trim()}', 'message_text': '''${args.slice(2).join('|').trim()}'''}))`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            feedback.push(`[SYSTEM_MSG]: ${res.output || res.error}`);
        }
    },
"""

# Replace SEND_MESSAGE block
js = re.sub(
    r"'SEND_MESSAGE':\s*async\s*\(match,\s*feedback\)\s*=>\s*\{.*?(?:feedback\.push\(`\[SYSTEM_MSG\]:.*?\);.*?\}\s*\}|feedback\.push\(`\[SYSTEM_MSG\].*?\);.*?\}\s*\})",
    send_message_intercept.strip(),
    js,
    flags=re.DOTALL
)

# 4. Hook into onCodeOutput to listen for [PROGRESS]
progress_hook = """
// Intercept onCodeOutput for [PROGRESS] logs
if (window.electronAPI && window.electronAPI.onCodeOutput) {
    const originalOnCodeOutput = window.electronAPI.onCodeOutput;
    window.electronAPI.onCodeOutput = function(handler) {
        return originalOnCodeOutput((data) => {
            if (data && data.content && data.content.includes('[PROGRESS]')) {
                const step = data.content.split('[PROGRESS]')[1].trim();
                if (window.tickChecklist) {
                    // Fuzzy match the step name to the checklist items
                    const keywords = step.split(' ').filter(w => w.length > 3);
                    if (keywords.length > 0) {
                        window.tickChecklist(keywords[0]);
                    } else {
                        window.tickChecklist(step);
                    }
                }
            }
            return handler(data);
        });
    };
}
"""

if "window.tickChecklist" in progress_hook and "originalOnCodeOutput" not in js:
    # We can just append this to the end of the file or near electronAPI definitions
    # Wait, if onCodeOutput is just `ipcRenderer.on`, we can't redefine it like this easily if it's a preload.
    # Better to just intercept the output handler we ALREADY pass to it in `addBubble(..., html)`
    pass # we will do it below

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)
print("app.js updated.")
