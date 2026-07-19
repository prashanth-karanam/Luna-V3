import sys
import re

app_path = "src/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add global variable for contacts
if "let aliasData = {};" not in content:
    content = content.replace("let storageData = JSON.parse(localStorage.getItem('luna_storage') || '[]');",
                              "let storageData = JSON.parse(localStorage.getItem('luna_storage') || '[]');\nlet aliasData = {};\ntry {\n  if (window.osAPI && window.osAPI.existsSync('contacts.json')) {\n    aliasData = JSON.parse(window.osAPI.readFileSync('contacts.json', 'utf-8'));\n  }\n} catch (e) { console.error('Failed to load contacts.json:', e); }")

# 2. Modify getSystemPrompt to inject Alias Data
alias_prompt_code = """
  // Inject Alias Storage mapping
  if (Object.keys(aliasData).length > 0) {
    base += `\\n[SAVED ALIASES / CONTACTS]:\\n`;
    for (const [name, target] of Object.entries(aliasData)) {
      base += `- ${name} -> ${target}\\n`;
    }
  }
"""
if "[SAVED ALIASES / CONTACTS]" not in content:
    content = content.replace("if (typeof lunaMemory !== 'undefined' && lunaMemory.length > 0) {",
                              alias_prompt_code + "\n  if (typeof lunaMemory !== 'undefined' && lunaMemory.length > 0) {")

# 3. Add DOM logic for the Alias UI
dom_logic = """
  // --- Alias Storage Logic ---
  const aliasApp = document.getElementById('aliasApp');
  const aliasName = document.getElementById('aliasName');
  const aliasId = document.getElementById('aliasId');
  const aliasLink = document.getElementById('aliasLink');
  const addAliasBtn = document.getElementById('addAliasBtn');
  const aliasListContainer = document.getElementById('aliasListContainer');

  function renderAliases() {
    if (!aliasListContainer) return;
    aliasListContainer.innerHTML = '';
    for (const [name, target] of Object.entries(aliasData)) {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.padding = '8px';
      div.style.borderBottom = '1px solid var(--border)';
      div.innerHTML = `<span style="color:#fff;"><b>${name}</b> <span style="color:var(--dim);font-size:0.8rem;">(${target})</span></span>
                       <button class="btn-outline del-alias" data-name="${name}" style="padding:2px 6px; font-size:0.7rem; color:var(--red); border-color:var(--red);">Del</button>`;
      aliasListContainer.appendChild(div);
    }
    
    document.querySelectorAll('.del-alias').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const n = e.target.dataset.name;
        delete aliasData[n];
        if (window.osAPI) window.osAPI.writeFileSync('contacts.json', JSON.stringify(aliasData, null, 4), 'utf-8');
        renderAliases();
      });
    });
  }

  if (addAliasBtn) {
    addAliasBtn.addEventListener('click', () => {
      const n = aliasName.value.trim().toLowerCase();
      const id = aliasId.value.trim();
      const link = aliasLink.value.trim();
      const app = aliasApp.value;
      if (!n) return;
      
      let targetValue = id;
      if (link) {
         targetValue = link;
      }
      
      aliasData[n] = targetValue;
      
      if (window.osAPI) {
         window.osAPI.writeFileSync('contacts.json', JSON.stringify(aliasData, null, 4), 'utf-8');
      }
      
      aliasName.value = '';
      aliasId.value = '';
      aliasLink.value = '';
      renderAliases();
    });
    
    // Initial render
    renderAliases();
  }
"""
if "Alias Storage Logic" not in content:
    content = content.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\n" + dom_logic)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated app.js")
