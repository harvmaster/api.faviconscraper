import axios from 'axios';
import puppeteer from 'puppeteer';
import probe from 'probe-image-size';

import cacheManager from '../../services/CacheManager';
import analytics from '../../services/Analytics';
import { getBrowserInstance } from '../../services/Browser';

type ProbedInfo = {
    width: number;
    height: number;
    type: string;
    mime: string;
    wUnits: string;
    hUnits: string;
    length: number;
    url: string;
};

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

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("Fetching icons for", url, "from", ip, 'at', new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }), ' (newGetIcon)');

    const event = analytics.createEvent(ip, url as string);
    const cachedIcons = cacheManager.get(url);

    if (cachedIcons) {
        event.cache = true;
        event.completed = new Date();
        event.result = cachedIcons;
        return res.json(cachedIcons);
    }

    let page;
    let errors = []
    try {
        const browser = await getBrowserInstance();
        page = await browser.newPage();

        // Handle page errors
        page.on('error', (err) => {
            console.error('Page crashed:', err);
            if (page) {
                page.close();
            }
        });

        await page.setRequestInterception(true);
        page.on('request', req => {
            const filteredTypes = [
                'image', 'media', 'font', 'texttrack',
                'eventsource', 'websocket', 'manifest', 'other', 'script'
            ];
            if (filteredTypes.includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 375, height: 667 });

        await page.goto(`https://${url}`, { waitUntil: 'networkidle0' });

        const icons = await page.evaluate(() => {
            const iconElements = [
                ...document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]')
            ];
            // @ts-ignore
            return iconElements.map(icon => icon.href.startsWith('/') ? `${location.origin}${icon.href}` : icon.href);
        });

        await page.close();

        const result = await Promise.all(icons.map(async icon => {
            try {
                const size = await probe(icon) as ProbedInfo;
                return {
                    size: { width: size.width, height: size.height },
                    type: size.type,
                    mime: size.mime,
                    src: icon
                } as ImageInfo;
            } catch (err) {
                console.error(`Error probing image ${icon}`);
                errors.push(err);
                return {
                    src: icon
                } as ImageInfo;
            }
        })).then(results => results.filter(icon => icon !== null));

        cacheManager.set(url, result, Date.now() + 1000 * 60 * 60 * 24 * 14);

        event.completed = new Date();
        event.result = result;

        res.json(result.sort((a, b) => b.size.width - a.size.width));
    } catch (error) {
        console.error(`Error fetching icons for ${url}:` );
        errors.push(error);
        res.status(500).json({ error: "Failed to fetch icons." });
    } finally {
        if (page && !page.isClosed()) {
            await page.close();
        }
        event.errors = errors;
    }
};

export default getIcon;