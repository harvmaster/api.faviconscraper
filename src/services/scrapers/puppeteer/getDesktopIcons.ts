import { RawIcon } from '../../../types'
import getFavicons from "./getFavicons";

const DESKTOP_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

export const getDesktopIcons = async (url: string, useScripts = false): Promise<RawIcon[]> => {
  const favicons = await getFavicons(url, { useScripts, agent: DESKTOP_AGENT, viewport: { width: 1920, height: 1080 } });

  const desktopIcons: RawIcon[] = favicons.map(icon => ({ src: icon, device: 'desktop' }));
  if (desktopIcons.length === 0 && !useScripts) {
    return getDesktopIcons(url, true);
  }

  return desktopIcons
}

export default getDesktopIcons