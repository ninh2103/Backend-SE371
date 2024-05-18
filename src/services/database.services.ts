import { Collection, Db, MongoClient } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import { error } from 'console'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Friend from '~/models/schemas/Friend.chema'
import Post from '~/models/schemas/Post.schema'
import Like from '~/models/schemas/Like.schema'
import Comment from '~/models/schemas/Comment.schema'
import Share from '~/models/schemas/Share.schema'
import Group from '~/models/schemas/Group.schema'
import Conversation from '~/models/schemas/Conversation.schema'
config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@mxhdacdo3.oz6exzd.mongodb.net/?retryWrites=true&w=majority&appName=MXHDACDO3`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch {
      console.log(Error)
      throw error
    }
  }
  async indexUsers() {
    const exits = await this.users.indexExists(['email_1', 'email_1_password_1', 'username_1'])
    if (!exits) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }
  async indexRefreshToken() {
    const exits = await this.refreshTokens.indexExists(['exp_1', 'token_1'])
    if (!exits) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }
  }
  async indexFriends() {
    const exits = await this.friends.indexExists(['user_id_1_friend_user_id_1'])
    if (!exits) {
      this.friends.createIndex({ user_id: 1, friend_user_id: 1 })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USER_COLLECTION as string)
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }
  get friends(): Collection<Friend> {
    return this.db.collection(process.env.DB_FRIEND_COLLECTION as string)
  }
  get posts(): Collection<Post> {
    return this.db.collection(process.env.DB_POST_COLLECTION as string)
  }
  get likes(): Collection<Like> {
    return this.db.collection(process.env.DB_LIKE_COLLECTION as string)
  }
  get comments(): Collection<Comment> {
    return this.db.collection(process.env.DB_COMMENT_COLLECTION as string)
  }
  get shares(): Collection<Share> {
    return this.db.collection(process.env.DB_SHARE_COLLECTION as string)
  }
  get groups(): Collection<Group> {
    return this.db.collection(process.env.DB_GROUP_COLLECTION as string)
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection(process.env.DB_CONVERSATION_COLLECTION as string)
  }
}
const databaseService = new DatabaseService()
export default databaseService
