import { ObjectId } from 'mongodb'
import { ConversationStatus } from '~/constants/enums'

interface ConversationType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  group_id?: ObjectId
  conversation_Type: ConversationStatus
  created_at?: Date
  updated_at?: Date
}
export default class Conversation {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  group_id?: ObjectId
  conversation_Type: ConversationStatus
  created_at?: Date
  updated_at?: Date
  constructor({
    _id,
    sender_id,
    updated_at,
    group_id,
    conversation_Type,
    receiver_id,
    content,
    created_at
  }: ConversationType) {
    const date = new Date()
    this._id = _id
    this.sender_id = sender_id
    this.receiver_id = receiver_id
    this.content = content
    this.group_id = group_id
    this.conversation_Type = conversation_Type
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
