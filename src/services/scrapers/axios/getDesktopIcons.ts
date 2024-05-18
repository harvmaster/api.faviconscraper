import { RawIcon } from '../types'

import getFavicons from './getFavicons'

const DESKTOP_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

export const getDesktopIcons = async (url: string): Promise<RawIcon[]> => {
  const favicons = await getFavicons(url, { agent: DESKTOP_AGENT })

  const icons: RawIcon[] = favicons.map(icon => ({ src: icon, source: 'desktop' }))
  return icons
}

export default getDesktopIcons