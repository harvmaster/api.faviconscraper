import Express from 'express'

import getIcon from './revised_getIcon'

const router = Express.Router()

router.get('/', getIcon)

export default router
