const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// The core problem: switchMode('chat') hides chatPane then tries to restore it
// But if localStorage has 'console' or 'voice', those fixed panels cover col2/col3
// Let's diagnose what localStorage might have and what the init flow does

// Check if chat pane exists
console.log('chatPane exists:', html.includes('id="chatPane"'));

// Check structure: does chatPane come after col-3 opening
const col3Idx = html.indexOf('id="chatPane"');
const col2Idx = html.indexOf('dash-col dash-col-2');
console.log('col2 position:', col2Idx, '| chatPane (col3) position:', col3Idx);

// Check that voicePanel/consolePanel close properly before IDE pane
const voiceIdx = html.indexOf('id="voicePanel"');
const consoleIdx = html.indexOf('id="consolePanel"');
const ideIdx = html.indexOf('id="idePane"');
console.log('voicePanel pos:', voiceIdx);
console.log('consolePanel pos:', consoleIdx);
console.log('idePane pos:', ideIdx);

// Check z-indices
const zMatches = html.match(/z-index:[0-9]+/g);
console.log('\nZ-indices found:', [...new Set(zMatches)].join(', '));

// The REAL issue: does the chatPane get display:none from switchMode on load?
// If localStorage.luna_mode is 'console' or 'voice', chatPane stays hidden
// Solution: DON'T auto-hide chatPane - instead overlay the panels ONLY
