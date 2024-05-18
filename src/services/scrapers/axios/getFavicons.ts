import axios from 'axios'
import { load } from 'cheerio';


import faviconsFromHTML from './faviconsFromHTML';
import faviconsFromManifest from './faviconsFromManifest';

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

  const [
    manifestIcons,
    htmlIcons
  ] = await Promise.all([
    faviconsFromManifest(res),
    faviconsFromHTML(res)
  ])

  // console.log(`Icons for ${url}`)
  // console.log(manifestIcons, htmlIcons)

  const unformattedIcons = [...new Set([...manifestIcons, ...htmlIcons])]

  let location = getResponseDomain(res);
  if (location.endsWith('/')) location = location.slice(0, -1);

  // console.log(unformattedIcons)

  const icons = unformattedIcons.map(icon => {
    if (icon.startsWith('http')) return icon;
    if (icon.startsWith('/')) return `${location}${icon}`;
    return `${location}/${icon}`;
  })
  icons.push(`${location}/favicon.ico`)

  return icons
}

export default getFavicons