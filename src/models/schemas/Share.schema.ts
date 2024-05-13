import { ObjectId } from 'mongodb'
import { VisibilityType } from '~/constants/enums'

interface ShareType {
  _id?: ObjectId
  content?: string
  user_id: ObjectId
  post_id: ObjectId
  mentions?: string[]
  comment_id?: ObjectId
  like_id?: ObjectId
  visibility: VisibilityType
  created_at?: Date
}
export default class Share {
  _id?: ObjectId
  content?: string
  user_id: ObjectId
  post_id: ObjectId
  comment_id?: ObjectId
  like_id?: ObjectId
  mentions?: string[]
  visibility: VisibilityType
  created_at?: Date
  constructor({ _id, user_id, post_id, mentions, comment_id, content, like_id, created_at, visibility }: ShareType) {
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.post_id = post_id
    this.comment_id = comment_id || undefined
    this.content = content || ''
    this.mentions = mentions || []
    this.like_id = like_id || undefined
    this.visibility = visibility
    this.created_at = created_at || new Date()
  }
}
