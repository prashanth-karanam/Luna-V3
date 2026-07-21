const fs = require('fs');
let js = fs.readFileSync('src/app.js', 'utf8');

js = js.replace(/const chatPane = document\.getElementById\('chatPane'\);/g, "const chatPane = document.getElementById('chatModeContainer');");

fs.writeFileSync('src/app.js', js);
console.log('Fixed app.js logic to use chatModeContainer');
