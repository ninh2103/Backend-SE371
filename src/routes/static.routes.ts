import { Router } from 'express'
import {} from '~/controllers/medias.controller'
import { serveVideoStreamController } from '~/controllers/users.controllers'
const staticRouter = Router()
//staticRouter.get('/image/:name', serveImageController)
staticRouter.get('/video-stream/:name', serveVideoStreamController)
export default staticRouter
