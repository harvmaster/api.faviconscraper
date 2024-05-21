import probe from 'probe-image-size'

import { RawIcon, Icon, PipelineAction } from '../../types'

const WAIT_TIME = 2500
const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const probeIconSrc = async (icon: RawIcon): Promise<PipelineAction<Icon>> => {
  try {
    // Probe the icon source, wait for a maximum of WAIT_TIME
    const probed = await Promise.race([probe(icon.src), wait(WAIT_TIME)])

    if (!probed) throw new Error('Probe timeout')
    const { width, height, type, mime } = probed

    return {
      event: {
        event: 'probe_icon_src',
        status: 'success',
        data: {
          size: { width, height },
          type,
          mime,
          src: icon.src
        }
      },
      data: {
        size: { width, height },
        type,
        mime,
        src: icon.src,
        device: icon.device
      }
    }
  } catch (error) {
    return {
      event: {
        event: 'probe_icon_src',
        status: 'error',
        data: {
          src: icon.src,
          error: error.message
        }
      }
    }
  }
}

export default probeIconSrc