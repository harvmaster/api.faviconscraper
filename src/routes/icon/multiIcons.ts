import { Request, Response } from "express";
import probe from "probe-image-size";

import cacheManager from "../../services/CacheManager";
import Analytics from "../../services/Analytics";

import { getDesktopIcons, getMobileIcons } from "../../services/scrapers/axios";
import { Icon, RawIcon } from "../../services/scrapers/types";

export const getIcons = async (req: Request, res: Response) => {
  const { url } = req.query as { url: string };

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const ip = req.headers["x-forwarded-for"] as string

  console.log(
    "Fetching icons for", url,
    "from", ip, 
    "at", new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
    " (multiIcons)"
  );

  const event = Analytics.createEvent(ip, url as string);
  const cachedIcons = cacheManager.get(url);

  if (cachedIcons) {
    event.cache = true;
    event.completed = new Date();
    event.result = cachedIcons;
    return res.json(cachedIcons);
  }

  try {
    const [desktopIcons, mobileIcons] = await Promise.all([
      getDesktopIcons(url as string),
      getMobileIcons(url as string),
    ]);

    const icons: RawIcon[] = [...desktopIcons, ...mobileIcons];

    const iconPromises = icons.map(async (icon) => {
      try {
        const probed = await probe(icon.src);
        const { width, height, type, mime } = probed;

        return {
          size: { width, height },
          type,
          mime,
          src: icon.src,
        } as Icon;
      } catch (e) {
        console.error("Error probing image", icon.src, e);
        return null;
      }
    });

    const iconResults = await Promise.all(iconPromises);

    event.completed = new Date();
    event.result = iconResults;

    cacheManager.set(url as string, iconResults, 1000 * 60 * 60 * 24 * 14);

    return res.json(iconResults);
  } catch (err) {
    console.error(`Error fetching icons for ${url}`);
    event.errors = [err.message];
    return res.status(500).json({ error: "Error fetching icons" });
  }
}

export default getIcons;
