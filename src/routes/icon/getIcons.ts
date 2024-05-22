import { Request, Response } from "express";

import CacheManager from "../../services/CacheManager";
import Analytics, { ScraperEvent } from "../../services/Analytics";

import { Axios, Puppeteer } from "../../services/scrapers";

import { Icon, RawIcon } from "../../types";
import { probeIconSrc } from "../../core/icons/probeIconSrc";
import { removeDuplicates } from "../../lib";
import { ScrapingDevicesOptions, ScrapingOptions } from "../../types";

const CACHE_TIME = 1000 * 60 * 60 * 24 * 14

const LOG_REQUEST = true
const USE_CACHE = true

const USE_AXIOS = true
const USE_PUPPETEER = true

// try to get the icons from the cache
const tryFromCache = async (event: ScraperEvent, url: string, options?: ScrapingOptions) => {
  if (!USE_CACHE) return null

  const cachedIcons = await CacheManager.get(url);

  if (cachedIcons) {
    event.completed = new Date();
    event.cache = true;
    event.result = cachedIcons;

    if (options) {
      const filteredIcons = cachedIcons.filter((icon) => {
        if (icon.device === "desktop") return options.devices.desktop;
        if (icon.device === "mobile") return options.devices.mobile;
        return false;
      });

      if (filteredIcons.length) {
        return filteredIcons;
      }
    }

    return cachedIcons;
  }

  return null;
}

// log the request
const logRequest = (req: Request) => {
  if (!LOG_REQUEST) return

  const url = req.query.url as string;
  const ip = req.headers["x-forwarded-for"] as string;
  const options = getScrapingOptions(req);

  console.log(
    "Fetching icons for", url,
    "from", ip,
    "at", new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
    "with options", options,
    " (revised_getIcon)"
  );
}

// get the queries from the request and convert them to lowercase
const getLowerCaseQueries = (req: Request) => {
  const queries = req.query as { [key: string]: string };
  const lowerCaseQueries: { [key: string]: string } = {};

  for (const key in queries) {
    lowerCaseQueries[key.toLowerCase()] = queries[key];
  }

  return lowerCaseQueries;
}

// get the scraping options from the request
const getScrapingOptions = (req: Request): ScrapingOptions => {
  const { url, devices } = getLowerCaseQueries(req) as unknown as { url: string, devices: string[] };
  const deviceOptions = { desktop: true, mobile: true }

  if (devices) {
    deviceOptions.desktop = devices.includes("desktop");
    deviceOptions.mobile = devices.includes("mobile");
  }

  return { url, devices: deviceOptions }
}

// check if the url is valid
const isValidDomain = (url: string) => {
  let regex = new RegExp(/^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/);
  return regex.test(url);
}

// Generic scraper function that takes a list of functions and runs them in parallel
const useScraper = async (event: ScraperEvent, fns: () => Promise<RawIcon[]>[]): Promise<RawIcon[]> => {
  let errors: any[] = []
  const handleError = (err: any) => {
    if (err.code === "ENOTFOUND") {
      errors.push("Invalid URL");
    } else {
      errors.push(err);
    }
    return []
  }

  const results = await Promise.all(fns().map(fn => fn ? fn.catch(handleError) : []));

  if (errors.length) throw errors

  const icons = removeDuplicates(results.flat(), (icon) => icon.src);
  return icons
}

// fetch the icons using axios
const useAxios = async (event: ScraperEvent, url: string, options?: ScrapingOptions): Promise<RawIcon[]> => {
  if (!USE_AXIOS) throw new Error("Axios is disabled");

  const axiosScrapers = () => [
    (options?.devices.desktop !== false ? Axios.getDesktopIcons(url) : undefined),
    (options?.devices.mobile !== false ? Axios.getMobileIcons(url) : undefined)
  ]

  return useScraper(event, axiosScrapers);
}

// fetch the icons using puppeteer
const usePuppeteer = async (event: ScraperEvent, url: string, options?: ScrapingOptions): Promise<RawIcon[]> => {
  if (!USE_PUPPETEER) throw new Error("Puppeteer is disabled");

  const puppeteerScrapers = () => [
    (options?.devices.desktop !== false ? Puppeteer.getDesktopIcons(url) : undefined),
    (options?.devices.mobile !== false ? Puppeteer.getMobileIcons(url) : undefined)
  ]
  return useScraper(event, puppeteerScrapers);
}

// pipe the event through the function and log the result to the event
const pipeEvent = async <T>(event: ScraperEvent, name: string, fn: () => Promise<T>): Promise<T> => {
  const { result, errors } = await fn()
      .then((res) => ({ result: res, errors: [] }))
      .catch((err) => ({ result: [], errors: [err] })) as { result: T, errors: any[] };

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
  const options = getScrapingOptions(req);
  const url = options.url;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!isValidDomain(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // I have this here to know if the server is currently being used and by how many unique users
  logRequest(req);
  const event = Analytics.createEvent(req.headers["x-forwarded-for"] as string, url);

  // Get the scraping options

  // Check if the url has been scraped before, if it has, update the event and return the cached icons
  const cachedIcons = await tryFromCache(event, url, options);
  if (cachedIcons) {
    return res.json(cachedIcons);
  }

  // Fetch the icons using axios
  let rawIcons = await pipeEvent(event, "useAxios", () => useAxios(event, url, options));

  // use puppeteer to get the icons if axios fails
  if (!rawIcons.length) {
    rawIcons = await pipeEvent(event, "usePuppeteer", () => usePuppeteer(event, url, options));
  }

  // probe the icons to get their dimensions
  const icons = await probeIcons(event, rawIcons);

  // Update the Event. Its not going to change past this point
  event.completed = new Date();
  event.result = icons;

  // return if no icons are found
  if (!icons.length) {
    event.errors?.push("No icons found");
    return res.status(404).json({ error: "No icons found" });
  }

  // cache the icons
  if (USE_CACHE) {
    CacheManager.set(url, icons, CACHE_TIME);
  }

  // return the icons
  return res.json(icons);
}

// export the route handler with error handling
export const route_getIcons = (req: Request, res: Response) => {
  try {
    getIcons(req, res);
  } catch (err) {
    if (err?.message && !err.message.includes('ERR_NAME_NOT_RESOLVED')) {
      console.error(err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

export default route_getIcons