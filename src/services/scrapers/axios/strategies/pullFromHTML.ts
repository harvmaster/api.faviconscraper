import { AxiosResponse } from 'axios'
import { load } from 'cheerio'

import { FAVICON_TAGS } from '../../FaviconTags'

export const pullFromHTML = async (response: AxiosResponse): Promise<string[]> => {
  const $ = load(response.data)

  let icons: string[] = []

  $(FAVICON_TAGS.join(', ')).map((i, element) => {
    const href = $(element).attr('href');
    return href
  }).get().forEach(icon => icons.push(icon));

  // Href ends with favicon.ico or favicon*.ico
  $('link[href$="favicon.ico"], link[href*="favicon"].ico').map((i, element) => {
    const href = $(element).attr('href');
    return href
  }).get().forEach(icon => icons.push(icon));

  return icons
}

export default pullFromHTML