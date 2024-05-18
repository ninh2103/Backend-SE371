import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controller'
import { uploadVideoController } from '~/controllers/users.controllers'
import { acceptValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

export const mediasRouter = Router()
mediasRouter.post('/upload-image', acceptValidator, verifiedUserValidator, wrapRequestHandler(uploadImageController))
mediasRouter.post('/upload-video', acceptValidator, verifiedUserValidator, wrapRequestHandler(uploadVideoController))
