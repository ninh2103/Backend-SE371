import { VisibilityType } from '~/constants/enums'

export interface ShareReqBody {
  content: string
  visibility: VisibilityType
  mentions: string[]
  post_id: string
  comment_id: string
  like_id: string
}
