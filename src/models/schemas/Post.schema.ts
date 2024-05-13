import { ObjectId } from 'mongodb'
import { Media } from '../Others'
import _ from 'lodash'
import { VisibilityType } from '~/constants/enums'

interface PostContructor {
  _id?: ObjectId
  user_id: ObjectId
  content: string
  mentions: string[]
  medias: Media[]
  visibility: VisibilityType
  user_view?: number
  created_at?: Date
  updated_at?: Date
}
export default class Post {
  _id?: ObjectId
  user_id: ObjectId
  content: string
  mentions: ObjectId[]
  medias: Media[]
  visibility: VisibilityType
  user_view: number
  created_at: Date
  updated_at: Date
  constructor({
    _id,
    user_id,
    content,
    medias,
    visibility,
    mentions,
    user_view,
    created_at,
    updated_at
  }: PostContructor) {
    const date = new Date()
    this._id = _id
    this.content = content
    this.user_id = user_id
    this.medias = medias
    this.mentions = mentions.map((item) => new ObjectId(item))
    this.visibility = visibility
    this.user_view = user_view || 0
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
