// nextauth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";


interface IUser extends DefaultUser {
  debeResetearPassword: boolean;

  id: string;

  isActive?: boolean;
  nombre?: string | null;
  apellido?: string | null;
  /**
   * Roles del usuario
   */
  rol?: string | null;
  /**
   * Agregar cualquier otro campo que tu manejas
   */
}

declare module "next-auth" {
  interface User extends IUser {}
  interface Session {
    user: IUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends IUser {}
}