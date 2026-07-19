import re

html_path = "index.html"
css_path = "style.css"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

menu_html = """
        <div class="menu-wrapper" style="flex: 1; display: flex; flex-direction: column;">
          <div class="menu-container" style="flex: 0.7;">
            <input type="checkbox" id="menuToggle" style="display: none;" />
            <label for="menuToggle" class="menu-btn">
                <span class="icon">
                    <svg viewBox="0 0 175 80" width="30" height="30">
                        <rect width="80" height="15" fill="var(--blue)" rx="10"></rect>
                        <rect y="30" width="80" height="15" fill="var(--blue)" rx="10"></rect>
                        <rect y="60" width="80" height="15" fill="var(--blue)" rx="10"></rect>
                    </svg>
                </span>
                <span class="text">MENU</span>
            </label>
            
            <div class="menu-expanded">
              <article class="menu-article">
                <label for="m-dashboard" class="menu-item">
                  <input class="menu-radio" type="radio" name="path" id="m-dashboard" checked />
                  <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 13h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm-1 7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4zm10 0a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7zm1-10h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1z"></path></svg>
                  <span class="menu-label">Dashboard</span>
                </label>
                <label for="m-profile" class="menu-item">
                  <input class="menu-radio" type="radio" name="path" id="m-profile" />
                  <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z"></path></svg>
                  <span class="menu-label">Profile</span>
                </label>
                <label for="m-messages" class="menu-item">
                  <input class="menu-radio" type="radio" name="path" id="m-messages" />
                  <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5 18v3.766l1.515-.909L11.277 18H16c1.103 0 2-.897 2-2V8c0-1.103-.897-2-2-2H4c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h1zM4 8h12v8h-5.277L7 18.234V16H4V8z"></path><path d="M20 2H8c-1.103 0-2 .897-2 2h12c1.103 0 2 .897 2 2v8c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2z"></path></svg>
                  <span class="menu-label">Conversations</span>
                </label>
                <label for="m-help" class="menu-item">
                  <input class="menu-radio" type="radio" name="path" id="m-help" />
                  <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"></path><path d="M11 7h2v7h-2zm0 8h2v2h-2z"></path></svg>
                  <span class="menu-label">Help</span>
                </label>
                <label for="m-settings" class="menu-item">
                  <input class="menu-radio" type="radio" name="path" id="m-settings" />
                  <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 16c2.206 0 4-1.794 4-4s-1.794-4-4-4-4 1.794-4 4 1.794 4 4 4zm0-6c1.084 0 2 .916 2 2s-.916 2-2 2-2-.916-2-2 .916-2 2-2z"></path><path d="m2.845 16.136 1 1.73c.531.917 1.809 1.261 2.73.73l.529-.306A8.1 8.1 0 0 0 9 19.402V20c0 1.103.897 2 2 2h2c1.103 0 2-.897 2-2v-.598a8.132 8.132 0 0 0 1.896-1.111l.529.306c.923.53 2.198.188 2.731-.731l.999-1.729a2.001 2.001 0 0 0-.731-2.732l-.505-.292a7.718 7.718 0 0 0 0-2.224l.505-.292a2.002 2.002 0 0 0 .731-2.732l-.999-1.729c-.531-.92-1.808-1.265-2.731-.732l-.529.306A8.1 8.1 0 0 0 15 4.598V4c0-1.103-.897-2-2-2h-2c-1.103 0-2 .897-2 2v.598a8.132 8.132 0 0 0-1.896 1.111l-.529-.306c-.924-.531-2.2-.187-2.731.732l-.999 1.729a2.001 2.001 0 0 0 .731 2.732l.505.292a7.683 7.683 0 0 0 0 2.223l-.505.292a2.003 2.003 0 0 0-.731 2.733zm3.326-2.758A5.703 5.703 0 0 1 6 12c0-.462.058-.926.17-1.378a.999.999 0 0 0-.47-1.108l-1.123-.65.998-1.729 1.145.662a.997.997 0 0 0 1.188-.142 6.071 6.071 0 0 1 2.384-1.399A1 1 0 0 0 11 5.3V4h2v1.3a1 1 0 0 0 .708.956 6.083 6.083 0 0 1 2.384 1.399.999.999 0 0 0 1.188.142l1.144-.661 1 1.729-1.124.649a1 1 0 0 0-.47 1.108c.112.452.17.916.17 1.378 0 .461-.058.925-.171 1.378a1 1 0 0 0 .471 1.108l1.123.649-.998 1.729-1.145-.661a.996.996 0 0 0-1.188.142 6.071 6.071 0 0 1-2.384 1.399A1 1 0 0 0 13 18.7l.002 1.3H11v-1.3a1 1 0 0 0-.708-.956 6.083 6.083 0 0 1-2.384-1.399.992.992 0 0 0-1.188-.141l-1.144.662-1-1.729 1.124-.651a1 1 0 0 0 .471-1.108z"></path></svg>
                  <span class="menu-label">Settings</span>
                </label>
              </article>
            </div>
          </div>
          <div class="menu-footer" style="flex: 0.3;">
            <div class="placeholder-card" style="height: 100%;">Other Work (30%)</div>
          </div>
        </div>"""

html = html.replace(
    '<div class="placeholder-card" style="flex: 1;">Menu</div>',
    menu_html
)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)


with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

new_css = """
/* CUSTOM MENU STYLING */
.menu-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.menu-btn {
  width: 150px;
  height: 50px;
  border-radius: 12px;
  border: 1px solid rgba(0, 180, 255, 0.2);
  transition: all 0.5s ease-in-out;
  font-size: 16px;
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  display: flex;
  align-items: center;
  background: rgba(10, 15, 25, 0.6);
  backdrop-filter: blur(15px);
  color: var(--blue);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.menu-btn:hover {
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.25);
  border-color: rgba(0, 180, 255, 0.6);
}

.menu-btn .icon {
  position: absolute;
  height: 40px;
  width: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.5s;
  left: 10px;
}

.menu-btn .text {
  transform: translateX(65px);
  transition: all 0.5s;
}

.menu-btn:hover .icon {
  width: 130px;
}

.menu-btn:hover .text {
  opacity: 0;
}

.menu-btn:active .icon {
  transform: scale(0.85);
}

/* Expanded Menu */
.menu-expanded {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  max-width: 250px;
}

#menuToggle:checked ~ .menu-expanded {
  opacity: 1;
  max-height: 500px;
  margin-top: 15px;
}

.menu-article {
  display: flex;
  flex-direction: column;
  background: rgba(10, 15, 25, 0.7);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 180, 255, 0.15);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  padding: 8px;
  gap: 4px;
}

.menu-item {
  position: relative;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 15px;
  border-radius: 12px;
  cursor: pointer;
  color: var(--dim);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: rgba(0, 180, 255, 0.1);
  color: #fff;
}

.menu-icon {
  fill: currentColor;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-label {
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  white-space: nowrap;
}

.menu-item:has(.menu-radio:checked) {
  background: rgba(0, 180, 255, 0.2);
  border-color: rgba(0, 180, 255, 0.4);
  color: var(--blue);
  box-shadow: 0 4px 10px rgba(0, 180, 255, 0.15);
}

.menu-item:has(.menu-radio:checked) .menu-icon {
  transform: scale(1.15);
}

.menu-item:hover .menu-icon {
  transform: scale(1.15);
}
"""

with open(css_path, "a", encoding="utf-8") as f:
    f.write(new_css)

print("Applied menu.")
