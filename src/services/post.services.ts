import { ObjectId, WithId } from 'mongodb'
import Post from '~/models/schemas/Post.schema'
import databaseService from './database.services'
import { PostReqBody } from '~/models/requests/Post.requests'
import { VisibilityType } from '~/constants/enums'

class PostsService {
  async createPost(user_id: string, body: PostReqBody) {
    const result = await databaseService.posts.insertOne(
      new Post({
        content: body.content,
        mentions: body.mentions,
        medias: body.medias,
        visibility: body.visibility,
        user_id: new ObjectId(user_id)
      })
    )
    const post = await databaseService.posts.findOne({ _id: result.insertedId })
    return post
  }
  async increaseView(post_id: string, user_id: string) {
    const result = await databaseService.posts.findOneAndUpdate(
      {
        _id: new ObjectId(post_id)
      },
      {
        $inc: { user_view: 1 },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          user_view: 1,
          updated_at: 1
        }
      }
    )
    return result as WithId<{
      user_view: number
      updated_at: Date
    }>
  }
  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id)
    const friend = await databaseService.friends
      .find(
        {
          user_id: user_id_obj
        },
        {
          projection: {
            friend_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray()
    const ids = friend.map((item) => item.friend_user_id)
    ids.push(user_id_obj)
    const post = await databaseService.posts
      .aggregate([
        {
          $match: {
            user_id: {
              $in: ids
            }
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
          $unwind: {
            path: '$user'
          }
        },
        {
          $lookup: {
            from: 'friends',
            localField: 'user_id',
            foreignField: 'friend_user_id',
            as: 'friend'
          }
        },
        {
          $match: {
            $or: [
              {
                visibility: VisibilityType.EveryOne
              },
              {
                $and: [
                  {
                    visibility: VisibilityType.Friends
                  },
                  {
                    'user.status': 1
                  }
                ]
              }
            ]
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: 'mentions',
            foreignField: '_id',
            as: 'mentions'
          }
        },
        {
          $addFields: {
            mentions: {
              $map: {
                input: '$mentions',
                as: 'mention',
                in: {
                  _id: '$$mention._id',
                  name: '$$mention.name',
                  username: '$$mention.username',
                  email: '$$mention.email'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'post_id',
            as: 'likes'
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'post_id',
            as: 'comments'
          }
        },
        {
          $lookup: {
            from: 'shares',
            localField: '_id',
            foreignField: 'post_id',
            as: 'shares'
          }
        },
        {
          $addFields: {
            likes: {
              $size: '$likes'
            },
            comments: {
              $size: '$comments'
            },
            shares: {
              $size: '$shares'
            }
          }
        },
        {
          $project: {
            friend: 0,
            user: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0,
              permisson_id: 0,
              date_of_birth: 0
            }
          }
        }
      ])
      .toArray()
    return post
  }
}
const postsService = new PostsService()
export default postsService
