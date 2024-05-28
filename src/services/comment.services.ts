import Comment from '~/models/schemas/Comment.schema'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'

class CommentServices {
  async commentPost(user_id: string, post_id: string, content: string) {
    databaseService.comments.insertOne(
      new Comment({
        user_id: new ObjectId(user_id),
        post_id: new ObjectId(post_id),
        content: content
      })
    )
  }
  async delCommentPost(user_id: string, comment_id: string) {
    await databaseService.comments.findOneAndDelete({
      user_id: new ObjectId(user_id),
      _id: new ObjectId(comment_id)
    })
  }
  async getCommentPost({ post_id, page, limit }: { post_id: string; page: number; limit: number }) {
    const postComment = await databaseService.comments
      .aggregate<Comment>([
        {
          $match: {
            post_id: new ObjectId(post_id)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            user: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0,
              permisson_id: 0,
              date_of_birth: 0
            }
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    const totalPage = await databaseService.comments.countDocuments({
      post_id: new ObjectId(post_id)
    })
    return { postComment, totalPage }
  }
}

const commentsService = new CommentServices()
export default commentsService
