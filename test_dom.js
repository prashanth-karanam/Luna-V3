const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

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
    // Simulate clicking m-profile
    const profileRadio = dom.window.document.getElementById('m-profile');
    const profileLabel = profileRadio.parentElement;
    profileLabel.click();
    console.log("Clicked Profile. isChecked?", profileRadio.checked);
    
    // Check if modal has hidden class
    const profileModal = dom.window.document.getElementById('cyberProfileModal');
    console.log("Profile Modal hidden?", profileModal.classList.contains('hidden'));
    
    // Simulate clicking m-dashboard
    const dashRadio = dom.window.document.getElementById('m-dashboard');
    const dashLabel = dashRadio.parentElement;
    dashLabel.click();
    console.log("Clicked Dashboard. isChecked?", dashRadio.checked);
    
    console.log("Profile Modal hidden after dash click?", profileModal.classList.contains('hidden'));
}, 3000);
