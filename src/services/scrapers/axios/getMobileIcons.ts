import { RawIcon } from '../types';
import getFavicons from './getFavicons';

const MOBILE_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';

export const getMobileIcons = async (url: string): Promise<RawIcon[]> => {
  const favicons = await getFavicons(url, { agent: MOBILE_AGENT })

  const icons: RawIcon[] = favicons.map(icon => ({ src: icon, source: 'mobile' }))
  return icons
}

export default getMobileIcons