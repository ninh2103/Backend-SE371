import { Router } from 'express'
import {
  commentsPostController,
  delCommentsPostController,
  getCommentsPostController
} from '~/controllers/comments.controller'
import { createGroupController } from '~/controllers/groups.controller'
import { deleteCommentValidator, paginateValidator, postIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'
export const groupRouter = Router()
groupRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(createGroupController))
groupRouter.delete(
  '/post/:comment_id',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  deleteCommentValidator,
  wrapRequestHandler(delCommentsPostController)
)
groupRouter.get(
  '/:post_id/post',
  accessTokenValidator,
  verifiedUserValidator,
  paginateValidator,
  postIdValidator,
  wrapRequestHandler(getCommentsPostController)
)
