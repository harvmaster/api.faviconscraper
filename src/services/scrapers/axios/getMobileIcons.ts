import axios, { AxiosResponse } from 'axios'
import { load } from 'cheerio';
import { RawIcon } from '../types';

export const getMobileIcons = async (url: string): Promise<RawIcon[]> => {
  const res = await axios.get(`https://${url}`, {
      headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      }
  });

  const getResponseDomain = (response: AxiosResponse) => {
    const url = response.request.res.responseUrl;
    const domain = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/img);
    return domain ? domain[0] : response.request.res.responseUrl;
  }

  let dataURL = getResponseDomain(res);
  if (dataURL.endsWith('/')) dataURL = dataURL.slice(0, -1);
  
  const html = res.data;
  const $ = load(html);

  const location = dataURL;

  const defaultIcon: RawIcon = {
    src: `${location}/favicon.ico`,
    source: 'desktop',
  }
  let icons: RawIcon[] = [defaultIcon]

  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').map((i, element) => {
    const href = $(element).attr('href');
    let src = `${location}${href}`;
    if (href.startsWith('http')) src = href;
    return src
  }).get().forEach(icon => icons.push({ src: icon, source: 'mobile' }));

  // Href ends with favicon.ico or favicon*.ico
  $('link[href$="favicon.ico"], link[href*="favicon"].ico').map((i, element) => {
    const href = $(element).attr('href');
    let src = `${location}/${href}`;
    if (href.startsWith('http')) src = href;
    if (href.startsWith('/')) src = `${location}${href}`;
    return src
  }).get().forEach(icon => icons.push({ src: icon, source: 'mobile' }));

  return icons
}

export default getMobileIcons