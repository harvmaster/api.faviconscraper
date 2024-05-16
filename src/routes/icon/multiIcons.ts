import { Request, Response } from "express";
import probe from "probe-image-size";

import cacheManager from "../../services/CacheManager";
import Analytics from "../../services/Analytics";

import { getDesktopIcons, getMobileIcons } from "../../services/scrapers/axios";
import { Icon, RawIcon } from "../../services/scrapers/types";
import { Puppeteer } from "../../services/scrapers";

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

  const errors: any[] = []
  try {

    // get the image size and mime type information
    const probeImages = async (icons: RawIcon[]) => {

      const probingErrors: { src: string; error: string }[] = []
      const promises = icons.map(async (icon) => {
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
          console.error("Error probing image", icon.src);
          probingErrors.push({
            src: icon.src,
            error: e.message
          });
          errors.push({
            description: 'Probing Error',
            src: icon.src,
            error: e.message
          });
          return null;
        }
      })

      const iconResults = (await Promise.all(promises).then((icons) => icons.filter((icon) => icon !== null))) as Icon[];

      if (probingErrors.length > 0) {
        event.history.push({
          name: "probing_errors",
          count: probingErrors.length,
          errors: probingErrors
        })
      }

      return iconResults
    }

    // Scrape the page using puppeteer. Add this step to the event history
    const usePuppeteer = async (): Promise<Icon[]> => {
      const [desktopIcons, mobileIcons] = await Promise.all([
        Puppeteer.getDesktopIcons(url as string).then(probeImages).catch(err => []),
        Puppeteer.getMobileIcons(url as string).then(probeImages).catch(err => []),
      ]);

      const icons = [...desktopIcons, ...mobileIcons];
      event.history.push({
        name: "puppeteer_scrape",
        count: icons.length,
        icons: icons.map(icon => icon.src)
      })
      return icons
    }

    // Scrape the axios using puppeteer. Add this step to the event history
    const useAxois = async (): Promise<Icon[]> => {
      const [desktopIcons, mobileIcons] = await Promise.all([
        getDesktopIcons(url as string).then(probeImages).catch(err => []),
        getMobileIcons(url as string).then(probeImages).catch(err => []),
      ]);

      const icons = [...desktopIcons, ...mobileIcons];
      event.history.push({
        name: "axios_scrape",
        count: icons.length,
        icons: icons.map(icon => icon.src)
      })
      return icons
    }

    // Try to get the icons using axios. If no icons are found, try puppeteer
    const icons: Icon[] = await useAxois().then(icons => {
      if (icons.length === 0) {
        console.log("No icons found using axios, trying puppeteer", url)
        return usePuppeteer();
      }
      return icons
    })

    // If no icons are found, return a 404
    const iconResults = icons;
    if (iconResults.length === 0) {
      event.history.push({
        name: "no_icons_found"
      })
      return res.status(404).json({ error: "No icons found" });
    }

    // Update the event and then cache the result
    event.completed = new Date();
    event.result = iconResults;

    cacheManager.set(url, iconResults, Date.now() + 1000 * 60 * 60 * 24 * 14);

    event.history.push({
      name: 'response_sent',
      count: iconResults.length,
      icons: iconResults.map(icon => icon.src)
    })

    return res.json(iconResults);
  } catch (err) {
    console.error(`Error fetching icons for ${url}`);
    event.errors = errors;
    return res.status(500).json({ error: "Error fetching icons" });
  }
}

export default getIcons;
