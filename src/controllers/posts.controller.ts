import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { PostReqBody } from '~/models/requests/Post.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import postsService from '~/services/post.services'

export const createPostController = async (
  req: Request<ParamsDictionary, any, PostReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await postsService.createPost(user_id, req.body)
  return res.json({
    message: 'Create post Successfully',
    result
  })
}
export const getPostController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await postsService.increaseView(req.params.post_id, user_id)
  const post = {
    ...req.post,
    user_view: result.user_view,
    updated_at: result.updated_at
  }
  return res.json({
    message: 'get post Successfully',
    result: post
  })
}
export const getNewFeedsController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await postsService.getNewFeeds({ user_id })
  return res.json({
    message: 'get new feed Successfully',
    result: result
  })
}
