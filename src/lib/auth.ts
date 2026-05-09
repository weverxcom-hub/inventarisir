import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSheetData } from "./google";

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

        const email = credentials.email.trim().toLowerCase();
        const data = await getSheetData("Users");
        const rows = data.slice(1);

        const userRow = rows.find(
          (row) => (row[1] || "").trim().toLowerCase() === email
        );
        if (!userRow) return null;

        const [name, storedEmail, hashedPassword, role] = userRow;
        if (!hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          hashedPassword
        );
        if (!isValid) return null;

        return {
          id: storedEmail,
          name,
          email: storedEmail,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
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
