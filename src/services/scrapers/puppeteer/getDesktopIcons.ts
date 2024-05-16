import { getBrowserInstance } from "../../Browser";
import { RawIcon } from '../types';

export const getDesktopIcons = async (url: string, useScripts = false): Promise<RawIcon[]> => {
  const browser = await getBrowserInstance();
  const page = await browser.newPage();

  const filteredContent = ['image', 'media', 'font', 'texttrack', 'eventsource', 'websocket', 'manifest', 'other'];
  if (useScripts) {
    filteredContent.push('script');
  }

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (filteredContent.includes(req.resourceType())) return req.abort();
    return req.continue();
  });
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
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
    return getDesktopIcons(url, true);
  }

  return mobileIcons
}

export default getDesktopIcons