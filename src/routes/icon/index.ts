import Express from 'express'

import getIcon from './multiIcons'

const router = Express.Router()

router.get('/', getIcon)

export default router
