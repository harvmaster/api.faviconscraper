import Express from 'express'

import icon from './icon'
import analytics from './analytics'

const router = Express.Router()

router.use('/icon', icon)
router.use('/analytics', analytics)

export default router