import { PrismaAdapter } from '@auth/prisma-adapter';
import type { AuthConfig } from '@auth/core';
import type { User, Account, Profile, Session } from '@auth/core/types';
import type { JWT } from '@auth/core/jwt';
import Google from '@auth/core/providers/google';
import Credentials from '@auth/core/providers/credentials';
import { prisma } from '../shared/infrastructure/database';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const authOptions: AuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@ejemplo.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<string, unknown> | undefined) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          throw new Error('Email y contraseña son requeridos');
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        // Verificar si el usuario tiene contraseña (puede ser usuario de OAuth)
        if (!user.password) {
          throw new Error('Este usuario se registró con Google. Por favor, inicia sesión con Google.');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta');
        }

        // Retornar datos del usuario (sin la contraseña)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async jwt({ token, user, account }: { 
      token: JWT; 
      user?: User; 
      account?: Account | null 
    }) {
      // Cuando el usuario inicia sesión, agregar datos al token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || UserRole.STUDENT;
        token.email = user.email;
      }

      // Si es un login con OAuth, actualizar datos del usuario
      if (account && account.provider === 'google') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }: { 
      session: Session; 
      token: JWT 
    }) {
      // Agregar datos del token a la sesión
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as UserRole;
        session.user.email = token.email as string;
      }

      return session;
    },
    async signIn({ user, account, profile }: { 
      user: User; 
      account?: Account | null; 
      profile?: Profile 
    }) {
      // Validar que el usuario esté activo o permitir registro
      if (account?.provider === 'google') {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        // Si no existe, se creará automáticamente por el adaptador
        // Si existe, permitir el login
        return true;
      }

      // Para credenciales, ya se validó en el authorize
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;

