const fs = require('fs');
let code = fs.readFileSync('src/app.js', 'utf8');
code = code.replace(/radio\.addEventListener\('change', \(e\) => \{\s*if \(e\.target\.checked\) \{/, "radio.addEventListener('click', (e) => {");
fs.writeFileSync('src/app.js', code);
