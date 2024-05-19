import axios from 'axios';
import puppeteer from 'puppeteer';
import probe from 'probe-image-size'

import cacheManager from '../../../services/CacheManager';
import analytics from '../../../services/Analytics';

type ProbedInfo = {
    width: number;
    height: number;
    type: string;
    mime: string;
    wUnits: string;
    hUnits: string;
    length: number;
    url: string;
}

type ImageInfo = {
    size: {
        width: number;
        height: number;
    };
    type: string;
    mime: string;
    src: string;
};

export const getIcon = async (req, res) => {
    const { url } = req.query;

    const ip = req.headers['x-forwarded-for']

    console.log("Fetching icons for", url, "from", ip, ' at ', new Date().toLocaleDateString());
    const event = analytics.createEvent(ip, url as string);
    // console.log('Created event')

    // Check if url is in cache
    const cachedIcons = cacheManager.get(url);
    if (cachedIcons) {
        // console.log("Returning cached icons");

        event.cache = true;
        event.completed = new Date();
        event.result = cachedIcons;

        return res.json(cachedIcons);
    }

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: '/usr/bin/chromium-browser',
            headless: 'new'
        });

        const page = await browser.newPage();

        // We dont need images or js
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const filteredTypes = ['image', 'media', 'font', 'texttrack', 'eventsource', 'websocket', 'manifest', 'other', 'script'];
            if (filteredTypes.includes(req.resourceType())) return req.abort();
            return req.continue();
        });

        // Set User-Agent to mimic a popular mobile browser
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');

        // Set viewport to simulate a mobile device
        await page.setViewport({ width: 375, height: 667 });

        // Wait until all network requests are complete
        await page.goto(`https://${url}`, { waitUntil: 'networkidle0' });
        
        // Optionally wait for the icon selector (adjust timeout as needed or remove this line if not required)
        // await page.waitForSelector('link[rel="apple-touch-icon"]', { timeout: 5000 });

        // Get the icons
        const icons = await page.evaluate(() => {
            const icons = Array.from(document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'));
            return icons.map(icon => {
                // @ts-ignore
                return icon.href.startsWith('/') ? `${location.origin}${icon.href}` : icon.href;
            });
        });

        // console.log(icons);

        await browser.close();

        // let html = '<html><head><title>Fetched Icons</title></head><body>';
        // html += `<h1>Icons for ${url}</h1>`;
        // icons.forEach(iconUrl => {
        //     html += `<img src="${iconUrl}" alt="Icon" style="max-width:100px; margin: 5px;">`;
        // });
        // html += '</body></html>';

        // return res.send(html);
        const getMeta = url => {
            return new Promise((resolve, reject) => {
                page.goto(url, { waitUntil: 'domcontentloaded' }).then(() => {
                    // get image width and height
                    page.evaluate(() => {
                        const image = document.querySelector('img');
                        const { naturalWidth, naturalHeight } = image;
                        resolve({ width: naturalWidth, height: naturalHeight });
                    })
                })
            });
        }

        const result: ImageInfo[] = await Promise.all(icons.map(async icon => {
            // console.log(icon)
            const size = await probe(icon).catch(err => console.error) as ProbedInfo;
            // console.log(size)
            return {
                size: {
                    width: size.width,
                    height: size.height,
                },
                type: size.type,
                mime: size.mime,
                src: icon
            }
        }))

        // Cache the result
        cacheManager.set(url, result, Date.now() + 1000 * 60 * 60 * 24 * 14); // 24 hours

        // Analytics
        event.completed = new Date();
        event.result = result;

        return res.json(
            result.sort((a, b) => b.size.width - a.size.width)
        );

    } catch (error) {
        console.error("Error fetching icons:", error);
        return res.status(500).json({ error: "Failed to fetch icons." });
    }
};

export default getIcon;
