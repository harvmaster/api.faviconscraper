import puppeteer from 'puppeteer';

let browserPromise = null;

export const getBrowserInstance = async () => {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: true
        });
    }
    return browserPromise;
};