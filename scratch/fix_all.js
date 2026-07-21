const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Step 1: Clean the unclosed SVG & defs from the ChatGPT/Gemini badge area
html = html.replace(/<svg viewBox="0 0 287.56 191" xmlns="http:\/\/www.w3.org\/2000\/svg">\r?\n\s*<defs>\r?\n/, '');

// Step 2: Relocate the panels block
const startVoiceStr = '  <!-- ══════════════════════════════════════════════════════════════ -->\r\n  <!-- VOICE MODE PANEL';
const startVoiceStrN = '  <!-- ══════════════════════════════════════════════════════════════ -->\n  <!-- VOICE MODE PANEL';

let startIdx = html.indexOf(startVoiceStr);
if (startIdx === -1) {
  startIdx = html.indexOf(startVoiceStrN);
}

const endIdeStr = '  <!-- IDE PANE - Global overlay, works on any screen -->';
const endIdx = html.indexOf(endIdeStr);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find the panels boundaries!");
  process.exit(1);
}

let panelsHtml = html.substring(startIdx, endIdx);

// Remove the panels from their original location
html = html.substring(0, startIdx) + html.substring(endIdx);

// Change fixed to absolute for voicePanel
panelsHtml = panelsHtml.replace(/position:\s*fixed/g, 'position:absolute');
// Change fixed to absolute for consolePanel
panelsHtml = panelsHtml.replace(/position:\s*fixed/g, 'position:absolute');
// Change fixed to absolute for aiDebugOverlay
panelsHtml = panelsHtml.replace('position:absolute;bottom:80px', 'position:absolute;bottom:80px'); // make sure it matches

// Step 3: Make dash-col-3 position: relative
const col3Str = '      <div class="dash-col dash-col-3">';
const col3RelStr = '      <div class="dash-col dash-col-3" style="position: relative;">';
html = html.replace(col3Str, col3RelStr);

// Step 4: Insert panels right after chatPane closes
// We match:
//   </label> (closes chat-wrapper)
//   </div> (closes chat-container)
//   </div> (closes AI-Input)
//   </div> (closes input-area)
//   blank line
//   </div> (closes chatPane)
const closePatternRegex = /<\/label>\s*<\/div>\s*<\/div>\s*<\/div>\s*\r?\n\s*\r?\n\s*<\/div>/;
const match = closePatternRegex.exec(html);

if (!match) {
  console.error("Could not find the closing pattern of chatPane!");
  process.exit(1);
}

// The match ends at the closing tag of chatPane. We insert panels right after this match.
const insertIdx = match.index + match[0].length;

html = html.substring(0, insertIdx) + '\n\n' + panelsHtml + '\n' + html.substring(insertIdx);

fs.writeFileSync('index.html', html);
console.log("Refactored index.html cleanly!");
