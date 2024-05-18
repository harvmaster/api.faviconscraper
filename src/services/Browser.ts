import puppeteer, { Browser } from 'puppeteer';

let browserPromise = null;

export const getBrowserInstance = async (): Promise<Browser> => {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: 'new'
        });
    }
    return browserPromise;
};