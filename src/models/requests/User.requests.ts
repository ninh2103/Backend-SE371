import { JwtPayload } from 'jsonwebtoken'
import { RoleType, Tokentype, UserVerifyStatus } from '~/constants/enums'
import { ParamsDictionary } from 'express-serve-static-core'

export interface LoginReqBody {
  email: string
  password: string
}
export interface RefreshTokenBodyReq {
  refresh_token: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: Tokentype
  verify: UserVerifyStatus
  exp: number
  iat: number
}
export interface RegisterReqBody {
  email: string
  password: string
  name: string
  comfirm_password: string
  date_of_birth: string
  username: string
  role: RoleType
}
export interface LogoutReqBody {
  refresh_token: string
}
export interface VerifyEmailReqBody {
  email_verify_token: string
}
export interface ForgotPasswordReqBody {
  email: string
}
export interface VerifyForgotPasswordTokenReqBody {
  forgot_password_token: string
}
export interface ResetPasswordREqBody {
  password: string
  comfirm_password: string
  forgot_password_token: string
}
export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  gender?: string
}
export interface SendFriendReqBody {
  friend_user_id: string
}
export interface UnFriendReqParams extends ParamsDictionary {
  user_id: string
}
export interface ChangePasswordReqBody {
  old_password: string
  password: string
  comfirm_password: string
}
export interface GetProfileReqParams extends ParamsDictionary {
  username: string
}
