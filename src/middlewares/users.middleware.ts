import { ParamSchema, checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { NextFunction, Request, Response } from 'express'
import { JsonWebTokenError } from 'jsonwebtoken'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERMESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/user.services'
import { validate } from '~/utils/validation'
import { verifyToken } from '~/utils/jwt'
import { hashPassword } from '~/utils/crypto'
import { config } from 'dotenv'
import { TokenPayload } from '~/models/requests/User.requests'
import { UserVerifyStatus } from '~/constants/enums'
import { REGEX_USER } from '~/constants/regex'
import { isInteger } from 'lodash'
import User from '~/models/schemas/User.schema'
import { wrapRequestHandler } from '~/utils/handlers'
config()
const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERMESSAGE.PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERMESSAGE.PASSWORD_LENGTH_BE_AT_LEAST_1_CHARACTERS_LONG
  },
  isStrongPassword: {
    options: {
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  },
  errorMessage: USERMESSAGE.PASSWORD_IS_STRONG
}
const comfirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERMESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERMESSAGE.CONFIRM_PASSWORD_LENGTH_BE_AT_LEAST_1_CHARACTERS_LONG
  },
  isStrongPassword: {
    options: {
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERMESSAGE.CONFIRM_PASSWORD_IS_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERMESSAGE.CONFIRM_PASSWORD_NOT_MATCH)
      }
      return true
    }
  }
}
const forgotPasswordToken: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: USERMESSAGE.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

        if (user === null) {
          throw new ErrorWithStatus({
            message: USERMESSAGE.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USERMESSAGE.FORGOT_PASSWORD_TOKEN_INVALID,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        req.decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: error.message,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        throw error
      }
      return true
    }
  }
}
const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERMESSAGE.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERMESSAGE.NAME_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERMESSAGE.NAME_MUST_BE_AT_LEAST_1_CHARACTERS_LONG
  },
  trim: true
}
const dateofbirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERMESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}
const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERMESSAGE.INVALID_USER_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      if (followed_user === null) {
        throw new ErrorWithStatus({
          message: USERMESSAGE.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: USERMESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERMESSAGE.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const exitEmail = await usersService.checkEmail(value)
            if (exitEmail) {
              throw new Error(USERMESSAGE.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERMESSAGE.PASSWORD_IS_REQUIRED
        },
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: USERMESSAGE.PASSWORD_LENGTH_BE_AT_LEAST_1_CHARACTERS_LONG
        },
        isStrongPassword: {
          options: {
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        },
        errorMessage: USERMESSAGE.PASSWORD_IS_STRONG
      },
      comfirm_password: {
        notEmpty: {
          errorMessage: USERMESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: USERMESSAGE.CONFIRM_PASSWORD_LENGTH_BE_AT_LEAST_1_CHARACTERS_LONG
        },
        isStrongPassword: {
          options: {
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERMESSAGE.CONFIRM_PASSWORD_IS_STRONG
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERMESSAGE.CONFIRM_PASSWORD_NOT_MATCH)
            }
            return true
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: USERMESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      },
      role: {
        notEmpty: {
          errorMessage: USERMESSAGE.ROLE_IS_REQUIRED
        },
        isNumeric: {
          errorMessage: USERMESSAGE.ROLE_IS_INT
        }
      }
    },
    ['body']
  )
)
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERMESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERMESSAGE.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(USERMESSAGE.USER_NOT_FOUND)
            }
            req.user = user

            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERMESSAGE.PASSWORD_IS_REQUIRED
        },
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: USERMESSAGE.PASSWORD_LENGTH_BE_AT_LEAST_1_CHARACTERS_LONG
        },
        isStrongPassword: {
          options: {
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        },
        errorMessage: USERMESSAGE.PASSWORD_IS_STRONG
      }
    },
    ['body']
  )
)
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({ message: USERMESSAGE.ACCESS_IS_REQUIRED, status: HTTP_STATUS.UNAUTHORIZED })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERMESSAGE.REFRESH_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({ token: value })
              ])
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USERMESSAGE.USER_REFRESH_TOKEN_OR_NOT_EXISTS,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: error.message,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERMESSAGE.EMAIL_VERIFY_TOKEN_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
              return true
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },

    ['body']
  )
)
export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USERMESSAGE.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user1 = await databaseService.users.findOne({
              email: value
            })
            if (user1 === null) {
              throw new Error(USERMESSAGE.USER_NOT_FOUND)
            }
            ;(req as Request).user = user1
            return true
          }
        }
      }
    },
    ['body']
  )
)
export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordToken
    },
    ['body']
  )
)
export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      comfirm_password: comfirmPasswordSchema,
      forgot_password_token: forgotPasswordToken
    },
    ['body']
  )
)
export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    throw next(
      new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: USERMESSAGE.USER_NOT_VERIFY
      })
    )
  }
  next()
}
export const updateMeValidator = validate(
  checkSchema(
    {
      name: { ...nameSchema, notEmpty: undefined, optional: true },
      dataofbirthSchema: {
        ...dateofbirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERMESSAGE.BIO_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERMESSAGE.BIO_LENGTH
        }
      },
      gender: {
        optional: true,
        isString: {
          errorMessage: USERMESSAGE.GENDER_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USERMESSAGE.GENDER_LENGTH
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USERMESSAGE.LOCATION_LENGTH
        },
        trim: true,

        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERMESSAGE.BIO_LENGTH
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USERMESSAGE.LOCATION_LENGTH
        },
        trim: true,

        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERMESSAGE.WEBSITE_LENGTH
        }
      },
      username: {
        optional: true,

        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!REGEX_USER.test(value)) {
              throw Error(USERMESSAGE.USERNAME_INVALID)
            }
            const user = await databaseService.users.findOne({
              username: value
            })
            if (user) {
              throw Error(USERMESSAGE.USERNAME_EXISTS)
            }
          }
        }
      },
      avatar: {
        optional: true,
        isString: {
          errorMessage: USERMESSAGE.LOCATION_LENGTH
        },
        trim: true,

        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USERMESSAGE.AVATAR_LENGTH
        }
      },
      cover_photo: {
        optional: true,
        isString: {
          errorMessage: USERMESSAGE.LOCATION_LENGTH
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USERMESSAGE.COVER_PHOTO_LENGTH
        }
      }
    },

    ['body']
  )
)
export const friendValidator = validate(
  checkSchema(
    {
      friend_user_id: userIdSchema
    },
    ['body']
  )
)
export const acceptValidator = validate(
  checkSchema(
    {
      friend_user_id: userIdSchema
    },
    ['body']
  )
)
export const unfriendValidator = validate(checkSchema({ user_id: userIdSchema }, ['params']))
export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value: string, { req }) => {
            const { user_id } = (req as Request).decoded_authorization as TokenPayload
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERMESSAGE.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            const { password } = user
            const isMatch = hashPassword(value) === password
            if (!isMatch) {
              throw new ErrorWithStatus({
                message: USERMESSAGE.OLD_PASSWORD_NOT_MATCH,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      },
      password: passwordSchema,
      comfirmpassword: comfirmPasswordSchema
    },
    ['body']
  )
)
export const getConversationsValidator = validate(
  checkSchema(
    {
      receiver_id: userIdSchema
    },
    ['params']
  )
)
// export const checkAdmin = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
//   const users = req.user as User
//   if (users && users.role === 1) {
//     if (!req.decoded_authorization) {
//       next()
//     } else {
//       throw new ErrorWithStatus({
//         status: HTTP_STATUS.UNAUTHORIZED,
//         message: USERMESSAGE.YOU_NOT_ADMIN
//       })
//     }
//   }
// })
