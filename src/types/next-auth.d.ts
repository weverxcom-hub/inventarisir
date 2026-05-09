import "next-auth";
import "next-auth/jwt";
import type { UserRole } from "./index";

declare module "next-auth" {
  interface User {
    role?: UserRole | string;
  }
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole | string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | string;
  }
}
