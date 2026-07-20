const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function test() {
    let options = new chrome.Options();
    options.addArguments('--headless');
    
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
        
    try {
        await driver.get('file:///C:/Users/PRASANTH/.gemini/antigravity/scratch/LunaOS/index.html');
        // Get browser logs
        let logs = await driver.manage().logs().get('browser');
        for (let log of logs) {
            console.log(`[${log.level}] ${log.message}`);
        }
    } finally {
        await driver.quit();
    }
}
test();
