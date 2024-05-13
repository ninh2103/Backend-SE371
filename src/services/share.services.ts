import { ShareReqBody } from '~/models/requests/Share.requests'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import Share from '~/models/schemas/Share.schema'
import { VisibilityType } from '~/constants/enums'

class ShareServices {
  async sharePost(
    user_id: string,
    post_id: string,
    like_id: string,
    comment_id: string,
    content: string,
    visibility: VisibilityType
  ) {
    const result = await databaseService.shares.insertOne(
      new Share({
        user_id: new ObjectId(user_id),
        post_id: new ObjectId(post_id),
        like_id: new ObjectId(like_id),
        comment_id: new ObjectId(comment_id),
        content: content,
        visibility: visibility
      })
    )
  }
  async delSharePost(user_id: string, share_id: string) {
    await databaseService.shares.deleteOne({
      _id: new ObjectId(share_id),
      user_id: new ObjectId(user_id)
    })
  }
}

const sharesService = new ShareServices()
export default sharesService
