import { ObjectId } from 'mongodb'
import { RoleType, UserVerifyStatus } from '~/constants/enums'

interface userType {
  _id?: ObjectId
  name?: string
  email: string
  date_of_birth?: Date
  gender?: string
  password: string
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  permisson_id?: ObjectId
  role: RoleType
  create_at?: Date
  update_at?: Date
}
export default class User {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  create_at: Date
  update_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  bio: string
  location: string
  website: string
  gender: string
  role: RoleType
  username: string
  avatar: string
  permisson_id?: ObjectId

  constructor(user: userType) {
    const date = new Date()
    this._id = user._id
    this.name = user.name || ''
    this.email = user.email
    this.avatar = user.avatar || ''
    this.bio = user.bio || ''
    this.create_at = user.create_at || date
    this.date_of_birth = user.date_of_birth || new Date()
    this.location = user.location || ''
    this.password = user.password
    this.username = user.username || ''
    this.update_at = user.update_at || date
    this.website = user.website || ''
    this.role = user.role
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.permisson_id = user.permisson_id
    this.gender = user.gender || ''
  }
}
