import axios from 'axios';
import { getResponseDomain } from './utils'
import { RawIcon } from '../types';

export const getFromManifest = async (url: string): Promise<RawIcon[]> => {
  const response = await axios.get(`https://${url}/manifest.json`)
  const { data } = response

  const domain: string = getResponseDomain(response)
  if (domain.endsWith('/')) domain.slice(0, -1)

  const icons: string[] = data.icons.map((icon: { src: string }) => icon.src)
  .map((icon: string) => {
    if (icon.startsWith('http')) return icon
    if (icon.startsWith('/')) return `${domain}${icon}`
    return `${domain}/${icon}`
  })

  return icons.map(icon => ({ src: icon, source: 'mobile' }))
}

export default getFromManifest