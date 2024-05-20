import { Router } from 'express'
import { createPostController, getNewFeedsController, getPostController } from '~/controllers/posts.controller'
import {
  creatPostValidator,
  paginateValidator,
  postIdValidator,
  visibilityValidator
} from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

export const postsRouter = Router()
postsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  creatPostValidator,
  wrapRequestHandler(createPostController)
)
postsRouter.get(
  '/:post_id',
  postIdValidator,
  accessTokenValidator,
  verifiedUserValidator,
  visibilityValidator,
  wrapRequestHandler(getPostController)
)
postsRouter.get('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getNewFeedsController))
