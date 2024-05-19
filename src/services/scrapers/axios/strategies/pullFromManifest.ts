import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio'
import { getResponseDomain } from './../utils';

export const pullFromManifest = async (response: AxiosResponse): Promise<string[]> => {
  const $ = load(response.data)

  const location = getResponseDomain(response)

  const manifestArr = $('link[rel="manifest"]').map((i, element) => {
    const href = $(element).attr('href')
    let src = `${location}/${href}`
    if (href.startsWith('http')) src = href
    if (href.startsWith('/')) src = `${location}${href}`
    return src
  }).get()
  if (manifestArr.length === 0) return []

  const manifest = manifestArr[0]
  const manifestResponse = await axios.get(manifest).catch(err => ({ data: { icons: [] } }))
  const manifestData = manifestResponse.data

  if (!manifestData?.icons) return []
  const icons = manifestData.icons.map((icon: { src: string }) => icon.src)

  return icons
}

export default pullFromManifest