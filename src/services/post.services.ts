import { ObjectId, WithId } from 'mongodb'
import Post from '~/models/schemas/Post.schema'
import databaseService from './database.services'
import { PostReqBody } from '~/models/requests/Post.requests'

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
  async getNewFeeds({ user_id }: { user_id: string }) {
    const user_id_obj = new ObjectId(user_id)

    // Lấy danh sách bạn bè của user
    const friends = await databaseService.friends
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
    const friendIds = friends.map((item) => item.friend_user_id)

    // Kết hợp user_id và friendIds
    const ids = [...new Set([user_id_obj, ...friendIds])]

    // Lấy thêm các bài viết mà user được tag vào
    const taggedPosts = await databaseService.posts
      .find(
        {
          mentions: user_id_obj
        },
        {
          projection: {
            _id: 1
          }
        }
      )
      .toArray()
    const taggedPostIds = taggedPosts.map((post) => post._id)

    // Truy vấn các bài viết
    const posts = await databaseService.posts
      .aggregate([
        {
          $match: {
            $or: [{ user_id: { $in: ids } }, { _id: { $in: taggedPostIds } }]
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
            },
            user_liked: {
              $cond: {
                if: {
                  $in: [user_id_obj, '$likes.user_id']
                },
                then: {
                  //_id: user_id_obj,
                  liked: true
                },
                else: {
                  liked: false
                }
              }
            },
            is_friend: true
          }
        },
        {
          $project: {
            user: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0,
              permisson_id: 0,
              date_of_birth: 0,
              role: 0
            }
            // likes: 0 // Ẩn chi tiết các like khác, chỉ giữ lại thông tin tổng số like và trạng thái like của người dùng hiện tại
          }
        }
      ])
      .toArray()
    const unrelatedPosts = await databaseService.posts
      .aggregate([
        {
          $match: {
            user_id: { $nin: ids },
            _id: { $nin: taggedPostIds }
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
            },
            user_liked: {
              $cond: {
                if: {
                  $in: [user_id_obj, '$likes.user_id']
                },
                then: {
                  liked: true
                },
                else: {
                  liked: false
                }
              }
            },
            is_friend: false
          }
        },
        {
          $project: {
            user: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0,
              permisson_id: 0,
              date_of_birth: 0,
              role: 0
            }
          }
        }
      ])
      .toArray()

    const result = [...posts, ...unrelatedPosts]

    return result
  }
}
const postsService = new PostsService()
export default postsService
