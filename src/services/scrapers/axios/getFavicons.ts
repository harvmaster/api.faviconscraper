import axios from 'axios'
import { load } from 'cheerio';

import { FAVICON_TAGS } from '../FaviconTags'
import { getResponseDomain } from './utils';

export type AxiosOptions = {
  agent: string;
}

export const getFavicons = async (url: string, options: AxiosOptions): Promise<string[]> => {
  const res = await axios.get(`https://${url}`, {
    headers: {
      'User-Agent': options.agent
    }
  })

  let location = getResponseDomain(res);
  if (location.endsWith('/')) location = location.slice(0, -1);
  
  const html = res.data;
  const $ = load(html);

  let icons: string[] = [`${location}/favicon.ico`]

  $(FAVICON_TAGS.join(', ')).map((i, element) => {
    const href = $(element).attr('href');
    let src = `${location}/${href}`;
    if (href.startsWith('http')) src = href;
    if (href.startsWith('/')) src = `${location}${href}`;
    return src
  }).get().forEach(icon => icons.push(icon));

  // Href ends with favicon.ico or favicon*.ico
  $('link[href$="favicon.ico"], link[href*="favicon"].ico').map((i, element) => {
    const href = $(element).attr('href');
    let src = `${location}${href}`;
    if (href.startsWith('http')) src = href;
    return src
  }).get().forEach(icon => icons.push(icon));

  return icons
}

export default getFavicons