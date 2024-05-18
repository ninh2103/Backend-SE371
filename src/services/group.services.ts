import Group from '~/models/schemas/Group.schema'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { RoleType } from '~/constants/enums'

class GroupServices {
  async createGroup({
    user_id,
    description,
    name
  }: {
    user_id: string
    description: string
    name: string
    role: RoleType
  }) {
    await databaseService.groups.insertOne(
      new Group({
        user_id: [{ user: new ObjectId(user_id), role: RoleType.Admin }],
        description,
        name
      })
    )
  }
  async delGroup(user_id: string, comment_id: string) {
    await databaseService.comments.findOneAndDelete({
      user_id: new ObjectId(user_id),
      _id: new ObjectId(comment_id)
    })
  }
}

const groupsService = new GroupServices()
export default groupsService
