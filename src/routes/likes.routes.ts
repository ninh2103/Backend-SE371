import { Router } from 'express'
import { likesPostController, unLikesPostController } from '~/controllers/likes.controller'
import { postIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'
export const likesRouter = Router()
likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(likesPostController)
)
likesRouter.delete(
  '/post/:post_id',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(unLikesPostController)
)
