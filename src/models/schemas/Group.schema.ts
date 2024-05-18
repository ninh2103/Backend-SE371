import { ObjectId } from 'mongodb'
import { RoleType } from '~/constants/enums'

interface GroupType {
  _id?: ObjectId
  name: string
  description: string
  post_id?: ObjectId
  created_at?: Date
  user_id: { user: ObjectId; role: RoleType }[]
}

export default class Group {
  _id?: ObjectId
  name: string
  description: string
  post_id?: ObjectId
  created_at?: Date
  user_id: { user: ObjectId; role: RoleType }[]

  constructor({ _id, name, created_at, user_id, description, post_id }: GroupType) {
    this._id = _id
    this.created_at = created_at || new Date()
    this.description = description
    this.post_id = post_id
    this.user_id = user_id || []
    this.name = name
  }
}
