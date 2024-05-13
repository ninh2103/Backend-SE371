import { ObjectId } from 'mongodb'
import { StatusFriend } from '~/constants/enums'

interface FriendType {
  _id?: ObjectId
  created_at?: Date
  user_id: ObjectId
  friend_user_id: ObjectId
  status: StatusFriend
}

export default class Friend {
  _id?: ObjectId
  created_at?: Date
  user_id: ObjectId
  friend_user_id: ObjectId
  status: StatusFriend
  constructor({ _id, friend_user_id, created_at, user_id, status }: FriendType) {
    this._id = _id
    this.created_at = created_at || new Date()
    this.user_id = user_id
    this.friend_user_id = friend_user_id
    this.status = status
  }
}
