import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
import Like from '~/models/schemas/Like.schema'

class LikeServices {
  async likePost(user_id: string, post_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      { user_id: new ObjectId(user_id), post_id: new ObjectId(post_id) },
      {
        $setOnInsert: new Like({
          user_id: new ObjectId(user_id),
          post_id: new ObjectId(post_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    return result as WithId<Like>
  }
  async unLikePost(user_id: string, post_id: string) {
    await databaseService.likes.findOneAndDelete({
      user_id: new ObjectId(user_id),
      post_id: new ObjectId(post_id)
    })
  }
}
const likesService = new LikeServices()
export default likesService
