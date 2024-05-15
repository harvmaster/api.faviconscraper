import Express from 'express'

import icon from './icon'

const router = Express.Router()

router.use('/icon', icon)

export default router