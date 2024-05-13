import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { CommentReqBody } from '~/models/requests/Comment.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import commentsService from '~/services/comment.services'

export const commentsPostController = async (
  req: Request<ParamsDictionary, any, CommentReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { post_id, content } = req.body
  await commentsService.commentPost(user_id, post_id, content)
  return res.json({
    message: 'Comment post Successfully'
  })
}
export const delCommentsPostController = async (req: Request, res: Response, next: NextFunction) => {
  const { comment_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  await commentsService.delCommentPost(user_id, comment_id)
  return res.json({
    message: 'delete Comment post Successfully'
  })
}
export const getCommentsPostController = async (req: Request, res: Response, next: NextFunction) => {
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const { totalPage, postComment } = await commentsService.getCommentPost({
    post_id: req.params.post_id,
    limit,
    page
  })
  return res.json({
    message: 'get Comment post Successfully',
    result: {
      postComment,
      limit,
      page,
      total_page: Math.ceil(totalPage / limit)
    }
  })
}
