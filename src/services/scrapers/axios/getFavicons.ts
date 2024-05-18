import axios, { AxiosResponse } from 'axios'
import { load } from 'cheerio';


import faviconsFromHTML from './faviconsFromHTML';
import faviconsFromManifest from './faviconsFromManifest';

import { getResponseDomain } from './utils';

export type AxiosOptions = {
  agent: string;
}

const getHead = (html: string) => {
  const $ = load(html)
  return $('head').html()
}

export const getFavicons = async (url: string, options: AxiosOptions): Promise<string[]> => {
  let res: AxiosResponse;
  
  try {
    res = await axios.get(`https://${url}`, {
      headers: {
        'User-Agent': options.agent
      }
    })
  } catch (err) {
    if (!err.response) throw err
    res = err.response
  }

  // console.log(res.data)
  // console.log(getHead(res.data))

  const [
    manifestIcons,
    htmlIcons
  ] = await Promise.all([
    faviconsFromManifest(res),
    faviconsFromHTML(res)
  ])

  // console.log(`Icons for ${url}`)
  // console.log(manifestIcons, htmlIcons)

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