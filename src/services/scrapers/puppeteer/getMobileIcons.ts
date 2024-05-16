import { getBrowserInstance } from "../../Browser";
import { RawIcon } from "../types";

export const getMobileIcons = async (url: string, useScripts = false): Promise<RawIcon[]> => {
  const browser = await getBrowserInstance();
  const page = await browser.newPage();

  if (useScripts) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const filteredTypes = ['image', 'media', 'font', 'texttrack', 'eventsource', 'websocket', 'manifest', 'other', 'script'];
      if (filteredTypes.includes(req.resourceType())) return req.abort();
      return req.continue();
    });
  }

  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
  await page.goto(`https://${url}`);
  const icons = await page.evaluate(() => {
    const location = window.location.origin;
    const icons = Array.from(document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"], link[href$="favicon.ico"]'));
    return icons.map((icon: HTMLLinkElement) => {
      const href = icon.href;
      let src = `${location}/${href}`;
      if (href.startsWith('http')) src = href;
      if (href.startsWith('/')) src = `${location}${href}`;
      return src
    });
  });
  await page.close();

  const mobileIcons = icons.map(icon => ({ src: icon, source: 'mobile' }));

  if (mobileIcons.length === 0 && !useScripts) {
    return getMobileIcons(url, true);
  }

  return mobileIcons
}

export default getMobileIcons