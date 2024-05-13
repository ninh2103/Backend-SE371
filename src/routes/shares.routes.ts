import { Router } from 'express'
import { likesPostController, unLikesPostController } from '~/controllers/likes.controller'
import { delsharesPostController, sharesPostController } from '~/controllers/shares.controller'
import { postIdValidator, shareCommentValidator, shareIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'
export const sharesRouter = Router()
sharesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(sharesPostController)
)
sharesRouter.delete(
  '/:share_id',
  accessTokenValidator,
  verifiedUserValidator,
  shareIdValidator,
  shareCommentValidator,
  wrapRequestHandler(delsharesPostController)
)
