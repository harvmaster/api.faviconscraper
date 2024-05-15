import Express from 'express'

import getAnalytics from './getAnalytics'

const router = Express.Router()

router.get('/', getAnalytics)

export default router
