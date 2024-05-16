import axios from 'axios'
import { load } from 'cheerio'
import { RawIcon } from '../types'

export const getDesktopIcons = async (url: string): Promise<RawIcon[]> => {
  const res = await axios.get(`https://${url}`, {
    headers: {
      // Desktop user agent
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  let dataURL = res.request.res.responseUrl;
  if (dataURL.endsWith('/')) dataURL = dataURL.slice(0, -1);
  
  const html = res.data;
  const $ = load(html);

  const location = dataURL;

  let icons: RawIcon[] = []

  $('meta[itemprop="image"]').map((i, element) => {
    const content = $(element).attr('content');
    return  content.startsWith('/') ? `${location}${content}` : content;
  }).get().forEach(icon => icons.push({ src: icon, source: 'desktop' }));

  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').map((i, element) => {
    const href = $(element).attr('href');
    return href.startsWith('/') ? `${location}${href}` : href;
  }).get().forEach(icon => icons.push({ src: icon, source: 'desktop' }));

  return icons
}

export default getDesktopIcons