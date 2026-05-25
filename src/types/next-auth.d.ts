// types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      rol: string
      isActive: boolean
      debeResetearPassword: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    rol: string
    isActive?: boolean
    debeResetearPassword?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    rol: string
    isActive: boolean
    debeResetearPassword: boolean
  }
}