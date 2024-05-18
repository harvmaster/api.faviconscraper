import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio'
import { RawIcon } from '../types';

export const getFromManifest = async (response: AxiosResponse): Promise<RawIcon[]> => {
  const $ = load(response.data)

  const manifestArr = $('link[rel="manifest"]').map((i, element) => {
    const href = $(element).attr('href')
    return href
  }).get()
  if (manifestArr.length === 0) return []

  const manifest = manifestArr[0]
  const manifestResponse = await axios.get(manifest)
  const manifestData = manifestResponse.data

  const icons = manifestData.icons.map((icon: { src: string }) => icon.src)

  return icons.map(icon => ({ src: icon, source: 'manifest' }))
}

export default getFromManifest