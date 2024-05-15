import Express from 'express'

import getAnalytics from './getAnalytics'
import getCache from './getCache'

const router = Express.Router()

router.get('/', getAnalytics)
router.get('cache', getCache)

export default router
