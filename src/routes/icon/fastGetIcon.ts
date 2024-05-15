import axios from 'axios';
import cheerio from 'cheerio';
import probe from 'probe-image-size';

import cacheManager from '../../services/CacheManager';
import analytics from '../../services/Analytics';

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
    console.log("Fetching icons for", url, "from", ip, 'at', new Date().toLocaleDateString(), ' (fastGetIcon)');

    const event = analytics.createEvent(ip, url as string);
    const cachedIcons = cacheManager.get(url);

    if (cachedIcons) {
        event.cache = true;
        event.completed = new Date();
        event.result = cachedIcons;
        return res.json(cachedIcons);
    }

    let errors = []
    try {
        const { data: html } = await axios.get(`https://${url}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
            }
        });
        const $ = cheerio.load(html);

        const location = `https://${url}`;

        const icons = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]')
            .map((i, element) => {
                const href = $(element).attr('href');
                return href.startsWith('/') ? `${location}${href}` : href;
            })
            .get(); // get() is used to convert cheerio object to an array

        const probes = icons.map(async (icon) => {
            try {
                const size = await probe(icon) as ProbedInfo;
                return {
                    size: { width: size.width, height: size.height },
                    type: size.type,
                    mime: size.mime,
                    src: icon
                };
            } catch (err) {
                console.error(`Error probing image ${icon}`);
                errors.push(err);
                return {
                    src: icon
                } as ImageInfo;
            }
        });
        
        const result = await Promise.all(probes).then(results => results.filter(icon => icon !== null));

        cacheManager.set(url, result, Date.now() + 1000 * 60 * 60 * 24 * 14);

        event.completed = new Date();
        event.result = result;

        res.json(result.sort((a, b) => b.size.width - a.size.width));
    } catch (error) {
        console.error(`Error fetching icons for ${url}`);
        errors.push(error);
        res.status(500).json({ error: "Failed to fetch icons." });
    } finally {
        event.errors = errors;
    }
};

export default getIcon;
