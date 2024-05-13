import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { LikeReqBody } from '~/models/requests/Like.requests'
import { ShareReqBody } from '~/models/requests/Share.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import sharesService from '~/services/share.services'

export const sharesPostController = async (
  req: Request<ParamsDictionary, any, ShareReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { post_id, like_id, comment_id, content, visibility } = req.body
  await sharesService.sharePost(user_id, post_id, like_id, comment_id, content, visibility)
  return res.json({
    message: 'Share Post Successfully'
  })
}

export const delsharesPostController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { share_id } = req.params
  await sharesService.delSharePost(user_id, share_id)
  return res.json({
    message: ' delete Share Post Successfully'
  })
}
