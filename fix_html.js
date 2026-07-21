const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const startVoice = html.indexOf('  <!-- ══════════════════════════════════════════════════════════════ -->\n  <!-- VOICE MODE PANEL');
const endIde = html.indexOf('  <!-- IDE PANE - Global overlay, works on any screen -->');
if (startVoice === -1 || endIde === -1) {
    console.error("Couldn't find panels block");
    process.exit(1);
}

let panelsHtml = html.substring(startVoice, endIde);
html = html.substring(0, startVoice) + html.substring(endIde);

// Replace position:fixed to absolute
panelsHtml = panelsHtml.replace(/position:\s*fixed/g, 'position:absolute');
// Debug overlay
panelsHtml = panelsHtml.replace(/position:\s*fixed;\s*bottom:\s*80px/g, 'position:absolute; bottom:80px');

// Wrap col-3
const col3Marker = '<!-- COL 3 (Chat) -->\r\n      <div class="dash-col dash-col-3">';
let col3Replacement = '<!-- COL 3 (Chat) -->\r\n      <div class="dash-col dash-col-3" style="position: relative;">\r\n        <div id="chatModeContainer" style="display: flex; flex-direction: column; flex: 1; height: 100%;">';
// Try with \n if \r\n fails
if (!html.includes(col3Marker)) {
    const col3MarkerN = '<!-- COL 3 (Chat) -->\n      <div class="dash-col dash-col-3">';
    const col3ReplacementN = '<!-- COL 3 (Chat) -->\n      <div class="dash-col dash-col-3" style="position: relative;">\n        <div id="chatModeContainer" style="display: flex; flex-direction: column; flex: 1; height: 100%;">';
    html = html.replace(col3MarkerN, col3ReplacementN);
} else {
    html = html.replace(col3Marker, col3Replacement);
}

// Find the exact closing tags
const searchStr = '        </div>\r\n\r\n        </div>\r\n      </div>\r\n    </div>';
const replaceWith = '        </div>\r\n        </div><!-- end chatModeContainer -->\r\n\r\n' + panelsHtml + '\r\n        </div>\r\n      </div>\r\n    </div>';

if (html.includes(searchStr)) {
    html = html.replace(searchStr, replaceWith);
} else {
    const searchStrN = '        </div>\n\n        </div>\n      </div>\n    </div>';
    const replaceWithN = '        </div>\n        </div><!-- end chatModeContainer -->\n\n' + panelsHtml + '\n        </div>\n      </div>\n    </div>';
    if (html.includes(searchStrN)) {
        html = html.replace(searchStrN, replaceWithN);
    } else {
        console.error("Could not find closing block");
        process.exit(1);
    }
}

fs.writeFileSync('index.html', html);
console.log('Fixed index.html structure.');
