import { VisibilityType } from '~/constants/enums'
import { Media } from '../Others'

export interface PostReqBody {
  visibility: VisibilityType
  content: string
  mentions: string[]
  medias: Media[]
}
