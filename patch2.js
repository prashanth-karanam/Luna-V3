const fs = require('fs');
let code = fs.readFileSync('src/app.js', 'utf8');
code = code.replace(/radio\.addEventListener\('click', \(e\) => \{\s*modal\.classList\.remove\('hidden'\);\s*setTimeout\(\(\) => \{ e\.target\.checked = false; \}, 100\);\s*\}\s*\}\);/, "radio.addEventListener('click', (e) => { modal.classList.remove('hidden'); setTimeout(() => { e.target.checked = false; }, 100); });");
fs.writeFileSync('src/app.js', code);
