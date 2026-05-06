import { NextRequest } from 'next/server'
import { createLoginSchema, createRegisterSchema } from './schema'
import { LoginService, RegisterService } from './service'
import { successResponse, badRequest, unauthorized } from '@/utils/api'
import { logger } from '@/lib/logger'
import { getLocaleFromRequest, translate } from '@/i18n/server'

function authValidationMessages(locale: ReturnType<typeof getLocaleFromRequest>) {
  return {
    invalidEmail: translate(locale, 'validation.invalidEmail'),
    nameMin: translate(locale, 'validation.nameMin'),
    passwordMin6: translate(locale, 'validation.passwordMin6'),
    passwordMin8: translate(locale, 'validation.passwordMin8'),
    passwordMismatch: translate(locale, 'validation.passwordMismatch'),
    tokenRequired: translate(locale, 'validation.tokenRequired'),
    refreshTokenRequired: translate(locale, 'validation.refreshTokenRequired'),
  }
}

export class AuthController {
  static async Login(req: NextRequest) {
    const locale = getLocaleFromRequest(req)

    try {
      const body = await req.json()
      const parsedData = createLoginSchema(authValidationMessages(locale)).safeParse(body)
      if (!parsedData.success) {
        return badRequest(translate(locale, 'auth.errors.invalidInput'))
      }

      const loginResult = await LoginService(parsedData.data)
      return successResponse(loginResult, translate(locale, 'auth.successLogin'))
    } catch (error: any) {
      logger.error('AuthController.Login error', error)
      return unauthorized(error.message || translate(locale, 'auth.errors.invalidCredentials'))
    }
  }

  static async Register(req: NextRequest) {
    const locale = getLocaleFromRequest(req)

    try {
      const body = await req.json()
      const parsedData = createRegisterSchema(authValidationMessages(locale)).safeParse(body)
      if (!parsedData.success) {
        return badRequest(
          translate(locale, 'auth.errors.invalidInput'),
          parsedData.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const registerResult = await RegisterService(parsedData.data)
      return successResponse(registerResult, translate(locale, 'auth.successRegister'))
    } catch (error: any) {
      logger.error('AuthController.Register error', error)
      return badRequest(error.message || translate(locale, 'auth.errors.server'))
    }
  }
}
