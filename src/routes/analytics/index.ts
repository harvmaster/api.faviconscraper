import Express from 'express'

import getAnalytics from './getAnalytics'
import getCache from './getCache'
import clearCache from './clearCache'

const router = Express.Router()

router.get('/', getAnalytics)
router.get('/cache', getCache)
router.get('/cache/clear', clearCache)

export default router
