const { JSDOM } = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Inject app.js directly to avoid module issues
let appJs = fs.readFileSync('src/app.js', 'utf8');
html = html.replace('<script type="module" src="./src/app.js"></script>', '<script>' + appJs + '</script>');

const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable"
});

// Mock localStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
    };
})();
Object.defineProperty(dom.window, 'localStorage', { value: localStorageMock });

dom.window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.log("ERROR: " + msg);
};

setTimeout(() => {
    console.log("Wait complete.");
    const profileRadio = dom.window.document.getElementById('m-profile');
    const profileLabel = profileRadio.parentElement;
    profileLabel.click();
    console.log("Clicked Profile. isChecked?", profileRadio.checked);
    
    const profileModal = dom.window.document.getElementById('cyberProfileModal');
    console.log("Profile Modal hidden?", profileModal.classList.contains('hidden'));
}, 3000);
