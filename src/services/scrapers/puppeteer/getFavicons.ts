import { getBrowserInstance } from "../../Browser";

export type BrowserOptions = {
  useScripts?: boolean;
  agent: string;
  viewport: { width: number; height: number };
}

export const getFavicons = async (url: string, options: BrowserOptions): Promise<string[]> => {
  const browser = await getBrowserInstance();
  const page = await browser.newPage();

  let icons: string[] = [];

  const filteredContent = ['image', 'media', 'font', 'texttrack', 'eventsource', 'websocket', 'manifest', 'other'];
  if (options.useScripts) {
    filteredContent.push('script');
  }

  try {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (filteredContent.includes(req.resourceType())) return req.abort();
      return req.continue();
    });
    
    await page.setUserAgent(options.agent);
     await page.setViewport(options.viewport);

     // Wait until all network requests are complete
     await page.goto(`https://${url}`, { waitUntil: 'networkidle0' });

    icons = await page.evaluate(() => {
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
  } catch (error) {
    console.error('Error getting icons', error);
  } finally {
    await page.close();
  }

  return icons
}

export default getFavicons
