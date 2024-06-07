import { Router } from 'express'
import {
  acceptFriendRequestController,
  changepasswordController,
  checkFriendController,
  delUserController,
  deleteFriendRequestController,
  emailVerifyController,
  forgotPasswordController,
  getAllUserController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  sendFriendRequestController,
  unFriendController,
  updateMeController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middleware'
import {
  acceptValidator,
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  friendValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfriendValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middleware'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const userRouter = Router()
userRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
userRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
userRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))
userRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))
userRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))
userRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))
userRouter.post(
  '/verify-forgot-password-token',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)
userRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))
userRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))
userRouter.get('/profile/:username', wrapRequestHandler(getProfileController))

userRouter.patch(
  '/update-me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'gender'
  ]),
  wrapRequestHandler(updateMeController)
)
userRouter.post(
  '/send-friend-requests',
  accessTokenValidator,
  verifiedUserValidator,
  friendValidator,
  wrapRequestHandler(sendFriendRequestController)
)
userRouter.post(
  '/accept-friend-requests',
  accessTokenValidator,
  verifiedUserValidator,
  acceptValidator,
  wrapRequestHandler(acceptFriendRequestController)
)
userRouter.get(
  '/check-friend/:username',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(checkFriendController)
)
userRouter.delete(
  '/delete-friend-requests/:friend_user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfriendValidator,
  wrapRequestHandler(deleteFriendRequestController)
)
userRouter.delete(
  '/unfriend/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfriendValidator,
  wrapRequestHandler(unFriendController)
)
userRouter.put(
  '/change-password',
  accessTokenValidator,
  changePasswordValidator,
  wrapRequestHandler(changepasswordController)
)
userRouter.delete('/delete-user', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(delUserController))
userRouter.get('/all-user', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getAllUserController))
export default userRouter
