import { NextFunction, Request, Response } from 'express'
import { RoleType } from '~/constants/enums'
import { USERMESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import { TokenPayload } from '~/models/requests/User.requests'
import groupsService from '~/services/group.services'

export const createGroupController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { role, name, description } = req.body

  await groupsService.createGroup({ user_id, role, name, description })
  return res.json({
    message: 'create Group Successfully'
  })
}
export const delCommentsPostController = async (req: Request, res: Response, next: NextFunction) => {
  return res.json({
    message: 'delete Comment post Successfully'
  })
}
