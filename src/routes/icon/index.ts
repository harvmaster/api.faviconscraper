import Express from 'express'

import getIcon from './getIcon'

const router = Express.Router()

router.get('/', getIcon)

export default router
