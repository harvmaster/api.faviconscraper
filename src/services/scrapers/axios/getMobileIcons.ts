import axios from 'axios'
import { load } from 'cheerio';
import { RawIcon } from '../types';

export const getMobileIcons = async (url: string): Promise<RawIcon[]> => {
  const res = await axios.get(`https://${url}`, {
      headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      }
  });

  let dataURL = res.request.res.responseUrl;
  if (dataURL.endsWith('/')) dataURL = dataURL.slice(0, -1);
  
  const html = res.data;
  const $ = load(html);

  const location = dataURL;

  const icons: RawIcon[] = []

  $('meta[itemprop="image"]').map((i, element) => {
    const content = $(element).attr('content');
    return  content.startsWith('/') ? `${location}${content}` : content;
  }).get().forEach(icon => icons.push({ src: icon, source: 'mobile' }));

  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').map((i, element) => {
    const href = $(element).attr('href');
    return href.startsWith('/') ? `${location}${href}` : href;
  }).get().forEach(icon => icons.push({ src: icon, source: 'mobile' }));

  return icons
}

export default getMobileIcons