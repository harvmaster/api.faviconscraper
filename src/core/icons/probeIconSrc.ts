import probe from 'probe-image-size'

import { RawIcon, Icon, PipelineAction } from '../../types'

export const probeIconSrc = async (icon: RawIcon): Promise<PipelineAction<Icon>> => {
  try {
    const probed = await probe(icon.src)
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
        source: icon.source
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