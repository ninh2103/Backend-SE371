import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import { USERMESSAGE } from '~/constants/messages'
import mediasService from '~/services/medias.services'
export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  //const formidable = (await import('formidable')).default
  const url = await mediasService.handleUploadImage(req)
  return res.json({
    message: USERMESSAGE.UPLOAD_SUCCESSFULLY,
    result: url
  })
}
