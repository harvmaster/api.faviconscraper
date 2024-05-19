import { Request, Response } from "express";

import CacheManager from "../../services/CacheManager";
import Analytics, { ScraperEvent } from "../../services/Analytics";

import { Axios, Puppeteer } from "../../services/scrapers";

import { Icon, RawIcon } from "../../services/scrapers/types";
import { probeIconSrc } from "../../core/icons/probeIconSrc";
import { removeDuplicates } from "../../lib";

const CACHE_TIME = 1000 * 60 * 60 * 24 * 14

const LOG_REQUEST = true
const USE_CACHE = true

const USE_AXIOS = true
const USE_PUPPETEER = false

// try to get the icons from the cache
const tryFromCache = async (event: ScraperEvent, url: string) => {
  if (!USE_CACHE) return null

  const cachedIcons = await CacheManager.get(url);

  if (cachedIcons) {
    event.completed = new Date();
    event.cache = true;
    event.result = cachedIcons;

    return cachedIcons;
  }

  return null;
}

// log the request
const logRequest = (req: Request) => {
  if (!LOG_REQUEST) return

  const url = req.query.url as string;
  const ip = req.headers["x-forwarded-for"] as string;
  console.log(
    "Fetching icons for", url,
    "from", ip,
    "at", new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
    " (revised_getIcon)"
  );
}

// fetch the icons using axios
const useAxios = async (event: ScraperEvent, url: string): Promise<RawIcon[]> => {
  if (!USE_AXIOS) throw new Error("Axios is disabled");

  let errors: any[] = []
  const handleError = (err: any) => {
    errors.push(err);
    return []
  }

  const [desktopIcons, mobileIcons] = await Promise.all([
    Axios.getDesktopIcons(url as string).catch(handleError),
    Axios.getMobileIcons(url as string).catch(handleError)
  ]);
  
  if (errors.length) throw errors
  
  const icons = removeDuplicates([...desktopIcons, ...mobileIcons], (icon) => icon.src);
  return icons
}

// fetch the icons using puppeteer
const usePuppeteer = async (event: ScraperEvent, url: string): Promise<RawIcon[]> => {
  if (!USE_PUPPETEER) throw new Error("Puppeteer is disabled");

  let errors: any[] = []
  const handleError = (err: any) => {
    errors.push(err);
    return []
  }

  const [desktopIcons, mobileIcons] = await Promise.all([
    Puppeteer.getDesktopIcons(url as string).catch(handleError),
    Puppeteer.getMobileIcons(url as string).catch(handleError)
  ]);

  if (errors.length) throw errors

  const icons = removeDuplicates([...desktopIcons, ...mobileIcons], (icon) => icon.src);
  return icons
}

// pipe the event through the function and log the result to the event
const pipeEvent = async <T>(event: ScraperEvent, name: string, fn: () => Promise<T>): Promise<T> => {
  const { result, errors } = await fn().then((res) => ({ result: res, errors: [] })).catch((err) => ({ result: [], errors: [err] })) as { result: T, errors: any[] };

  event.history.push({
    name,
    errors,
    data: result
  });

  return result
}

// probe the icons to get their dimensions
const probeIcons = async (event: ScraperEvent, icons: RawIcon[]): Promise<Icon[]> => {
  const probedIconPromises = await Promise.all(icons.map(icon => probeIconSrc(icon)));

  const events = []
  const probedIcons = []

  // push the events and icons to their respective arrays
  for (const { data, event } of probedIconPromises) {
    events.push(event);
    if (data) probedIcons.push(data);
  }

  event.history.push(...events);
  return probedIcons
}

export const getIcons = async (req: Request, res: Response) => {
  const { url } = req.query as { url: string }
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // I have this here to know if the server is currently being used and by how many unique users
  logRequest(req);
  const event = Analytics.createEvent(req.headers["x-forwarded-for"] as string, url);

  // Check if the url has been scraped before, if it has, update the event and return the cached icons
  const cachedIcons = await tryFromCache(event, url);
  if (cachedIcons) {
    return res.json(cachedIcons);
  }

  // Fetch the icons using axios
  let rawIcons = await pipeEvent(event, "useAxios", () => useAxios(event, url));

  // use puppeteer to get the icons if axios fails
  if (!rawIcons.length) {
    rawIcons = await pipeEvent(event, "usePuppeteer", () => usePuppeteer(event, url));
  }

  // probe the icons to get their dimensions
  const icons = await probeIcons(event, rawIcons);

  // return if no icons are found
  if (!icons.length) {
    event.errors.push("No icons found");
    return res.status(404).json({ error: "No icons found" });
  }

  // cache the icons
  if (USE_CACHE) {
    CacheManager.set(url, icons, CACHE_TIME);
  }

  // return the icons
  event.completed = new Date();
  event.result = icons;
  return res.json(icons);
}

export default getIcons