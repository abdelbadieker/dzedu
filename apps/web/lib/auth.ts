import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@dzedu/database';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    verifyRequest: '/verify-otp',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { profile: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (user.banState !== 'NONE') {
          if (user.banExpiresAt && user.banExpiresAt > new Date()) {
            throw new Error('ACCOUNT_SUSPENDED');
          }
          if (user.banState === 'PERMANENT') {
            throw new Error('ACCOUNT_BANNED');
          }
        }

        if (!user.isEmailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.profile
            ? `${user.profile.firstName ?? ''} ${user.profile.lastName ?? ''}`.trim()
            : undefined,
          role: user.role,
          language: user.language,
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const exists = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, isEmailVerified: true },
        });
        if (exists && !exists.isEmailVerified) {
          await prisma.user.update({
            where: { id: exists.id },
            data: { isEmailVerified: true },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'STUDENT';
        token.language = (user as any).language ?? 'fr';
      }

      if (trigger === 'update') {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, language: true, banState: true },
        });
        if (fresh) {
          if (fresh.banState !== 'NONE') {
            return {};
          }
          token.role = fresh.role;
          token.language = fresh.language;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).language = (token.language as string) ?? 'fr';
      }
      return session;
    },
  },
});
