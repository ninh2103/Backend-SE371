import { ObjectId } from 'mongodb'

interface CommentType {
  _id?: ObjectId
  content?: string
  user_id: ObjectId
  post_id: ObjectId
  created_at?: Date
}
export default class Comment {
  _id: ObjectId
  content: string
  user_id: ObjectId
  post_id: ObjectId
  created_at?: Date
  constructor({ _id, user_id, post_id, created_at, content }: CommentType) {
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.post_id = post_id
    this.content = content || ''
    this.created_at = created_at || new Date()
  }
}
