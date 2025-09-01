import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { env } from './env';
import { getUserByEmail, verifyPassword, updateLastLogin } from './users';

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your.email@arkansas.gov'
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user from database
          const user = await getUserByEmail(credentials.email);
          
          if (!user || !user.is_active) {
            return null;
          }

          // Verify password
          const isValidPassword = await verifyPassword(
            credentials.password, 
            user.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          // Update last login timestamp
          await updateLastLogin(user.user_id);

          // Return user object (password_hash excluded for security)
          return {
            id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active
          };

        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Store user info in JWT token
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.full_name = user.full_name;
        token.is_active = user.is_active;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as 'operations' | 'finance' | 'admin';
        session.user.full_name = token.full_name as string;
        session.user.is_active = token.is_active as boolean;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};