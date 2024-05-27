import { checkSchema } from 'express-validator'
import { ObjectId, WithId } from 'mongodb'
import { MediaType, StatusFriend, UserVerifyStatus, VisibilityType } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { POSTMESSAGE, USERMESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'
import { NextFunction, Request, Response } from 'express'
import Post from '~/models/schemas/Post.schema'
import { wrapRequestHandler } from '~/utils/handlers'
import Share from '~/models/schemas/Share.schema'

const postVisibility = numberEnumToArray(VisibilityType)
const postMedia = numberEnumToArray(MediaType)
export const creatPostValidator = validate(
  checkSchema({
    visibility: {
      isIn: {
        options: [postVisibility],
        errorMessage: POSTMESSAGE.INVALID_VISIBILITY
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(POSTMESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID)
          }
          return true
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' && !postMedia.includes(item.type)
            })
          ) {
            throw new Error(POSTMESSAGE.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    },
    content: {
      isString: true
    }
  })
)
export const postIdValidator = validate(
  checkSchema(
    {
      post_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: POSTMESSAGE.INVALID_POST_ID
              })
            }
            const [post] = await databaseService.posts
              .aggregate<Post>([
                {
                  $match: {
                    _id: new ObjectId(value)
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
                    }
                  }
                }
              ])
              .toArray()
            if (!post) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: POSTMESSAGE.POST_NOT_FOUND
              })
            }
            ;(req as Request).post = post
            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)
export const shareIdValidator = validate(
  checkSchema(
    {
      share_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: POSTMESSAGE.INVALID_SHARE_ID
              })
            }
            const share = await databaseService.shares.findOne({
              _id: new ObjectId(value)
            })
            if (!share) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: POSTMESSAGE.SHARE_NOT_FOUND
              })
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)
export const visibilityValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = req.post as Post

  if (post.visibility === VisibilityType.Friends) {
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERMESSAGE.ACCESS_IS_REQUIRED
      })
    }

    const author = await databaseService.users.findOne({
      _id: new ObjectId(post.user_id)
    })

    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERMESSAGE.USER_NOT_FOUND
      })
    }
    const currentUserID = new ObjectId(req.decoded_authorization.user_id)
    const isFriend = await databaseService.friends.countDocuments({
      user_id: new ObjectId(post.user_id),
      friend_user_id: currentUserID,
      status: StatusFriend.Accepted
    })

    if (!isFriend && !author._id.equals(currentUserID)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERMESSAGE.NOT_FRIEND
      })
    }
  }

  if (post.visibility === VisibilityType.Only) {
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERMESSAGE.ACCESS_IS_REQUIRED
      })
    }

    const currentUserID = new ObjectId(req.decoded_authorization.user_id)
    const { post_id } = req.params

    const post = await databaseService.posts.findOne({ _id: new ObjectId(post_id) })
    if (!post) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: POSTMESSAGE.POST_NOT_FOUND
      })
    } else if (!post.user_id.equals(currentUserID)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: USERMESSAGE.USER_NOT_AUTHOR
      })
    }
  }

  next()
})

export const deleteCommentValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Lấy thông tin từ request
  const { decoded_authorization } = req
  const { user_id } = decoded_authorization as { user_id: string }
  const { comment_id } = req.params
  const { post_id } = req.body

  // Kiểm tra nếu không có thông tin người dùng đã xác thực, trả về lỗi Unauthorized
  if (!decoded_authorization) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERMESSAGE.ACCESS_IS_REQUIRED
    })
  }

  // Kiểm tra quyền truy cập để xóa comment
  // Tìm comment trong cơ sở dữ liệu
  const comment = await databaseService.comments.findOne({ _id: new ObjectId(comment_id) })

  // Nếu không tìm thấy comment, trả về lỗi Not Found
  if (!comment) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: POSTMESSAGE.COMMENT_NOT_FOUND
    })
  }

  // Kiểm tra quyền truy cập của người dùng hiện tại
  // Xác định tác giả của bài post
  const post = await databaseService.posts.findOne({ _id: new ObjectId(post_id) })

  // Kiểm tra xem người dùng có phải là tác giả của bài post hay không
  if (!(post as WithId<Post>).user_id.equals(user_id) && !comment.user_id.equals(user_id)) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: USERMESSAGE.USER_NOT_AUTHOR_OR_COMMENT
    })
  }

  next()
})
export const shareCommentValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Lấy thông tin từ request
  const { decoded_authorization } = req
  const { user_id } = decoded_authorization as { user_id: string }
  const { share_id } = req.params

  // Kiểm tra nếu không có thông tin người dùng đã xác thực, trả về lỗi Unauthorized
  if (!decoded_authorization) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERMESSAGE.ACCESS_IS_REQUIRED
    })
  }

  // Kiểm tra quyền truy cập của người dùng hiện tại
  // Xác định tác giả của bài share
  const share = await databaseService.shares.findOne({ _id: new ObjectId(share_id) })

  // Kiểm tra xem người dùng có phải là tác giả của bài share hay không
  if (!(share as WithId<Share>).user_id.equals(user_id)) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: USERMESSAGE.USER_NOT_AUTHOR
    })
  }

  next()
})
export const paginateValidator = validate(
  checkSchema({
    limit: {
      isNumeric: true,
      custom: {
        options: async (value, { req }) => {
          const num = Number(value)
          if (num > 100 || num <= 1) {
            throw new Error('limit<100 or limit>=1')
          }
          return true
        }
      }
    },
    page: {
      isNumeric: true,
      custom: {
        options: async (value, { req }) => {
          const num = Number(value)
          if (num <= 0) {
            throw new Error('page>=0')
          }
          return true
        }
      }
    }
  })
)
