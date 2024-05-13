import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controller'
import { uploadVideoController } from '~/controllers/users.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

export const mediasRouter = Router()
mediasRouter.post('/upload-image', wrapRequestHandler(uploadImageController))
mediasRouter.post('/upload-video', wrapRequestHandler(uploadVideoController))
