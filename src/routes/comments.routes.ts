import { Router } from 'express'
import {
  commentsPostController,
  delCommentsPostController,
  getCommentsPostController
} from '~/controllers/comments.controller'
import { deleteCommentValidator, paginateValidator, postIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'
export const commentRouter = Router()
commentRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(commentsPostController)
)
commentRouter.delete(
  '/post/:comment_id',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  deleteCommentValidator,
  wrapRequestHandler(delCommentsPostController)
)
commentRouter.get(
  '/:post_id/post',
  accessTokenValidator,
  verifiedUserValidator,
  paginateValidator,
  postIdValidator,
  wrapRequestHandler(getCommentsPostController)
)
