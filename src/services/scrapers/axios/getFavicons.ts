import axios, { AxiosResponse } from 'axios'

import { pullFromHTML, pullFromManifest } from './strategies';
import { getResponseDomain } from './utils';

export type AxiosOptions = {
  agent: string;
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

  const [
    manifestIcons,
    htmlIcons
  ] = await Promise.all([
    pullFromManifest(res),
    pullFromHTML(res)
  ])

  const unformattedIcons = [...new Set([...manifestIcons, ...htmlIcons])]

  let location = getResponseDomain(res);
  if (location.endsWith('/')) location = location.slice(0, -1);

  const icons = unformattedIcons.map(icon => {
    if (icon.startsWith('http')) return icon;
    if (icon.startsWith('/')) return `${location}${icon}`;
    return `${location}/${icon}`;
  })
  icons.push(`${location}/favicon.ico`)

  return icons
}

export default getFavicons