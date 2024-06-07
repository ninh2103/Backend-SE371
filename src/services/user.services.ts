import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { StatusFriend, Tokentype, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { USERMESSAGE } from '~/constants/messages'
import Friend from '~/models/schemas/Friend.chema'
import { verify } from 'crypto'
import { sendEmail } from '~/utils/email'
config()
class UsersService {
  private decodedRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: Tokentype.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      option: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIREX_IN
      }
    })
  }
  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: Tokentype.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: Tokentype.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      option: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIREX_IN
      }
    })
  }
  private signAccessandRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }
  private signVerifyEmailToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: Tokentype.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      option: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIREX_IN
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: Tokentype.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      option: {
        expiresIn: process.env.PASSWORD_FORGOT_TOKEN_EXPIREX_IN
      }
    })
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const username = 'user' + user_id.toString()
    const email_verify_token = await this.signVerifyEmailToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        username: username,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        role: payload.role
      })
    )
    const [access_token, refresh_token] = await this.signAccessandRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { iat, exp } = await this.decodedRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    console.log('email_verify_token', email_verify_token)
    await sendEmail(payload.email, payload.name, email_verify_token, 'verify')
    return {
      access_token,
      refresh_token
    }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessandRefreshToken({
      user_id,
      verify
    })
    const { iat, exp } = await this.decodedRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])
    const decoded_refresh_token = await this.decodedRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
  async checkEmail(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERMESSAGE.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessandRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified,
            update_at: new Date()
          }
        }
      )
    ])
    const [access_token, refresh_token] = token
    const { iat, exp } = await this.decodedRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )

    return {
      access_token,
      refresh_token
    }
  }
  async resendVerifyEmail(user_id: string, name: string, email: string) {
    const email_verify_token = await this.signVerifyEmailToken({ user_id, verify: UserVerifyStatus.Unverified })
    await sendEmail(email, name, email_verify_token, 'verify')

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          update_at: true
        }
      }
    )
    return {
      message: USERMESSAGE.RESEND_EMAIL_VERIFY_SUCCESS
    }
  }
  async forgotPassword({
    user_id,
    verify,
    email,
    name
  }: {
    user_id: string
    verify: UserVerifyStatus
    email: string
    name: string
  }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          update_at: true
        }
      }
    )
    await sendEmail(email, name, forgot_password_token, 'forgotPassword')

    console.log('Forgot Password Token: ', forgot_password_token)
    return {
      message: USERMESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          update_at: true
        }
      }
    )
  }
  async getMe(user_id: string) {
    const user = databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0
        }
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0,
          verify: 0,
          create_at: 0,
          update_at: 0,
          permisson_id: 0,
          role: 0
        }
      }
    )
    return user
  }
  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, data_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          update_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }
  async sendFriendReq(user_id: string, friend_user_id: string) {
    const friend = await databaseService.friends.findOne({
      user_id: new ObjectId(user_id),
      friend_user_id: new ObjectId(friend_user_id)
    })
    if (friend === null) {
      await databaseService.friends.insertOne(
        new Friend({
          user_id: new ObjectId(user_id),
          friend_user_id: new ObjectId(friend_user_id),
          status: StatusFriend.Pending
        })
      )
      return {
        message: USERMESSAGE.SEND_FRIEND_REQUEST_SUCCESS
      }
    }
    return {
      message: USERMESSAGE.SEND_FRIEND_REQUEST_EXIST
    }
  }
  async acceptFriendReq(user_id: string, friend_user_id: string) {
    const friend = await databaseService.friends.findOne({
      user_id: new ObjectId(friend_user_id),
      friend_user_id: new ObjectId(user_id),
      status: StatusFriend.Pending
    })

    if (friend !== null) {
      await databaseService.friends.updateOne(
        { _id: new ObjectId(friend._id) },
        { $set: { status: StatusFriend.Accepted } }
      )

      await databaseService.friends.insertOne(
        new Friend({
          user_id: new ObjectId(user_id),
          friend_user_id: new ObjectId(friend_user_id),
          status: StatusFriend.Accepted
        })
      )

      return {
        message: USERMESSAGE.ACCEPT_FRIEND_REQUEST_SUCCESS
      }
    }

    return {
      message: USERMESSAGE.ACCEPT_FRIEND_REQUEST_NOT_FOUND
    }
  }
  async deleteFriendReq(user_id: string, friend_user_id: string) {
    const friend = await databaseService.friends.findOne({
      user_id: new ObjectId(friend_user_id),
      friend_user_id: new ObjectId(user_id),
      status: StatusFriend.Pending
    })

    if (friend === null) {
      return {
        message: USERMESSAGE.NOT_SEND_FRIEND_REQUEST
      }
    }
    await databaseService.friends.deleteOne({
      user_id: new ObjectId(friend_user_id),
      friend_user_id: new ObjectId(user_id)
    })
    return {
      message: USERMESSAGE.REFUSE_THE_FRIEND_REQUEST_SUCCESS
    }
  }
  async UnFriend(user_id: string, friend_user_id: string) {
    // Xác định bản ghi của user_id và friend_user_id
    const friend1 = await databaseService.friends.findOne({
      user_id: new ObjectId(user_id),
      friend_user_id: new ObjectId(friend_user_id)
    })
    const friend2 = await databaseService.friends.findOne({
      user_id: new ObjectId(friend_user_id),
      friend_user_id: new ObjectId(user_id)
    })

    if (friend1 === null || friend2 === null) {
      return {
        message: USERMESSAGE.NOT_FRIEND
      }
    }
    await Promise.all([
      databaseService.friends.deleteOne({
        user_id: new ObjectId(user_id),
        friend_user_id: new ObjectId(friend_user_id)
      }),
      databaseService.friends.deleteOne({
        user_id: new ObjectId(friend_user_id),
        friend_user_id: new ObjectId(user_id)
      })
    ])
    return {
      message: USERMESSAGE.UNFRIEND
    }
  }

  async changePassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          update_at: true
        }
      }
    )
    return {
      message: USERMESSAGE.CHANGE_PASSWORD_SUCCESS
    }
  }
  async getAllUser(user_id: string) {
    const user_id_obj = new ObjectId(user_id)

    const friends = await databaseService.friends
      .find({
        $or: [
          { user_id: user_id_obj, status: 1 },
          { friend_user_id: user_id_obj, status: 1 }
        ]
      })
      .toArray()

    // Trích xuất các user ID của bạn bè
    const friendUserIds = new Set(
      friends.map((friend) => {
        return friend.user_id.equals(user_id_obj) ? friend.friend_user_id.toString() : friend.user_id.toString()
      })
    )

    //Lấy chi tiết tất cả người dùng
    const users = await databaseService.users
      .find(
        {},
        {
          projection: {
            password: 0,
            forgot_password_token: 0,
            email_verify_token: 0,
            verify: 0,
            create_at: 0,
            update_at: 0,
            permisson_id: 0,
            role: 0
          }
        }
      )
      .toArray()

    // Thêm cờ isFriend cho mỗi người dùng
    const usersWithFriendFlag = users.map((user) => ({
      ...user,
      isFriend: friendUserIds.has(user._id.toString())
    }))

    return usersWithFriendFlag
  }
  async checkFriend(user_id: string, username: string) {
    const user_id_obj = new ObjectId(user_id)

    // Tìm người dùng từ username
    const otherUser = await databaseService.users.findOne({ username: username }, { projection: { _id: 1 } })

    if (!otherUser) {
      throw new Error('User not found')
    }

    const otherUser_id_obj = otherUser._id

    // Kiểm tra trạng thái mối quan hệ giữa user_id và otherUser_id
    const friendStatus = await databaseService.friends.findOne({
      $or: [
        { user_id: user_id_obj, friend_user_id: otherUser_id_obj },
        { user_id: otherUser_id_obj, friend_user_id: user_id_obj }
      ]
    })

    let status
    if (!friendStatus) {
      status = 0 // Chưa là bạn bè
    } else if (friendStatus.status === 0) {
      status = 0 // Chưa là bạn bè
    } else if (friendStatus.status === 1) {
      status = 1 // Đã gửi yêu cầu kết bạn
    } else if (friendStatus.status === 2) {
      status = 2 // Đã là bạn bè
    }

    return {
      status
    }
  }
}

const usersService = new UsersService()
export default usersService
