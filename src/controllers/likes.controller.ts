import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { LikeReqBody } from '~/models/requests/Like.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import likesService from '~/services/like.services'

export const likesPostController = async (
  req: Request<ParamsDictionary, any, LikeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await likesService.likePost(user_id, req.body.post_id)
  return res.json({
    message: ' Like Post Successfully',
    result
  })
}
export const unLikesPostController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  await likesService.unLikePost(user_id, req.params.post_id)
  return res.json({
    message: ' Unlike Post Successfully'
  })
}
