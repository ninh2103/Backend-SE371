import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { ParamsDictionary } from 'express-serve-static-core'
import fs from 'fs'
import {
  ChangePasswordReqBody,
  ForgotPasswordReqBody,
  GetProfileReqParams,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenBodyReq,
  RegisterReqBody,
  ResetPasswordREqBody,
  SendFriendReqBody,
  TokenPayload,
  UnFriendReqParams,
  UpdateMeReqBody,
  VerifyEmailReqBody,
  VerifyForgotPasswordTokenReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import usersService from '~/services/user.services'
import { USERMESSAGE } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'
import mediasService from '~/services/medias.services'
import path from 'path'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { min, range } from 'lodash'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  return res.json({
    message: 'login success',
    result
  })
}
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({
    message: 'register success',
    result
  })
}
export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.json(result)
}
export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenBodyReq>,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload
  const result = await usersService.refreshToken({ refresh_token, user_id, verify, exp })
  return res.json({
    message: USERMESSAGE.REFRESH_TOKEN_SUCCESS,
    result
  })
}
export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERMESSAGE.USER_NOT_FOUND
    })
  }
  if (user.email_verify_token === '') {
    return res.json({
      message: USERMESSAGE.EMAIL_ALREADY_VERIFY_TOKEN
    })
  }
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERMESSAGE.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERMESSAGE.USER_NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERMESSAGE.EMAIL_ALREADY_VERIFY_TOKEN
    })
  }
  const result = await usersService.resendVerifyEmail(user_id, user.name, user.email)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id, verify, name, email } = req.user as User
  const result = await usersService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify, name, email })
  return res.json(result)
}
export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  return res.json({
    message: USERMESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}
export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordREqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = usersService.resetPassword(user_id, password)

  return res.json({
    message: USERMESSAGE.RESET_PASSWORD_SUCCESS
  })
}
export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getMe(user_id)
  return res.json({
    message: USERMESSAGE.GET_ME_SUCCESS,
    result: user
  })
}
export const getProfileController = async (
  req: Request<ParamsDictionary, any, GetProfileReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { username } = req.params
  const user = await usersService.getProfile(username)
  return res.json({
    message: USERMESSAGE.GET_PROFILE_SUCCESS,
    result: user
  })
}
export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const body = req.body
  const user = await usersService.updateMe(user_id, body)
  return res.json({
    message: USERMESSAGE.UPDATE_ME_SUCCESS,
    result: user
  })
}
export const sendFriendRequestController = async (
  req: Request<ParamsDictionary, any, SendFriendReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { friend_user_id } = req.body
  const result = await usersService.sendFriendReq(user_id, friend_user_id)
  return res.json(result)
}

export const acceptFriendRequestController = async (req: Request, res: Response, next: NextFunction) => {
  const { friend_user_id } = req.body
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.acceptFriendReq(user_id, friend_user_id)
  return res.json(result)
}
export const checkFriendController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { username } = req.params
  const result = await usersService.checkFriend(user_id, username)
  return res.json(result)
}
export const deleteFriendRequestController = async (req: Request, res: Response, next: NextFunction) => {
  const { friend_user_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.deleteFriendReq(user_id, friend_user_id)
  return res.json(result)
}
export const unFriendController = async (req: Request<UnFriendReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: friend_user_id } = req.params
  const result = await usersService.UnFriend(user_id, friend_user_id)
  return res.json(result)
}
export const changepasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(user_id, password)
  return res.json(result)
}
export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  //const formidable = (await import('formidable')).default
  const url = await mediasService.handleUploadVideo(req)
  return res.json({
    message: USERMESSAGE.UPLOAD_SUCCESSFULLY,
    result: url
  })
}
export const serveVideoStreamController = async (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Require Range header')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  const videoSize = fs.statSync(videoPath).size
  const chunkSize = 10 ** 6
  const start = Number(range.replace(/\D/g, ''))
  const end = Math.min(start + chunkSize, videoSize - 1)
  const contentLength = end - start + 1
  const mime = (await import('mime')).default
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Range': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
export const delUserController = async (req: Request, res: Response, next: NextFunction) => {
  const user_id = req.decoded_authorization as TokenPayload
  await databaseService.users.deleteOne({ user_id })
  return res.json({
    message: USERMESSAGE.DELETE_USER_SUCCESS
  })
}
export const getAllUserController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const users = await usersService.getAllUser(user_id)
  return res.json({
    message: USERMESSAGE.GET_ALL_USER_SUCCESS,
    result: users
  })
}
