import Express from 'express'

import getIcon from './getIcons'

const router = Express.Router()

router.get('/', getIcon)

export default router
