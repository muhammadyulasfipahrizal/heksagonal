
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";

import prisma from "@/utils/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const email = credentials.email.trim().toLowerCase();

          const user = await prisma.user.findUnique({
            where: { email },
          });

          // Akun OAuth tidak memiliki password.
          if (!user?.password) {
            return null;
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role ?? "user",
          };
        } catch (error) {
          console.error("Credentials authorization failed:", error);
          throw new Error("Unable to authenticate user");
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        return true;
      }

      if (account?.provider === "google") {
        const googleProfile = profile as
          | { email_verified?: boolean }
          | undefined;

        // Hanya menerima alamat email Google yang terverifikasi.
        return Boolean(
          user.email && googleProfile?.email_verified === true
        );
      }

      return false;
    },

    async jwt({ token, user }) {
      // Saat login, ambil identitas dan role dari database HEKSAGONAL.
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: {
            email: user.email.trim().toLowerCase(),
          },
          select: {
            id: true,
            role: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role ?? "user";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.id === "string" ? token.id : "";

        session.user.role =
          typeof token.role === "string" ? token.role : "user";
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 15 * 60,
    updateAge: 5 * 60,
  },

  jwt: {
    maxAge: 15 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
