import { getBrowserInstance } from "../../Browser";
import { RawIcon } from '../types';

export const getDesktopIcons = async (url: string): Promise<RawIcon[]> => {
  const browser = await getBrowserInstance();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.goto(`https://${url}`);
  const icons = await page.evaluate(() => {
    const location = window.location.origin;
    const icons = Array.from(document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'));
    return icons.map((icon: HTMLLinkElement) => {
      const href = icon.href;
      return href.startsWith('/') ? `${location}${href}` : href;
    });
  });
  await page.close();
  return icons.map(icon => ({ src: icon, source: 'desktop' }));
}

export default getDesktopIcons