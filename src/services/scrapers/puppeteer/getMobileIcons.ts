import { getBrowserInstance } from "../../Browser";
import { RawIcon } from "../types";

export const getMobileIcons = async (url: string): Promise<RawIcon[]> => {
  const browser = await getBrowserInstance();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
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
  return icons.map(icon => ({ src: icon, source: 'mobile' }));
}

export default getMobileIcons