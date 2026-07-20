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
        // Wait 3 seconds for DOMContentLoaded timeout
        await driver.sleep(3000);
        let logs = await driver.manage().logs().get('browser');
        for (let log of logs) {
            console.log([] );
        }
    } finally {
        await driver.quit();
    }
}
test();
