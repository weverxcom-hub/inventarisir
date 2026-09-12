import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSheetData } from "./google";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const key = credentials.email.toLowerCase();
        if (isRateLimited(key)) return null;

        const data = await getSheetData("Users");
        const rows = data.slice(1); // skip header

        const userRow = rows.find((row) => row[1] === credentials.email);
        if (!userRow) {
          recordFailedAttempt(key);
          return null;
        }

        const [name, email, hashedPassword, role] = userRow;
        const isValid = await bcrypt.compare(
          credentials.password,
          hashedPassword
        );
        if (!isValid) {
          recordFailedAttempt(key);
          return null;
        }

        clearAttempts(key);
        return {
          id: email,
          name,
          email,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
