import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const list = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const allowedDomains = list(process.env.ALLOWED_EMAIL_DOMAINS);
const allowedEmails = list(process.env.ALLOWED_EMAILS);

/** Empty allowlists = any verified Google account may sign in. */
export function isEmailAllowed(email?: string | null) {
  if (!email) return false;
  if (!allowedDomains.length && !allowedEmails.length) return true;
  const normalized = email.toLowerCase();
  return allowedEmails.includes(normalized) || allowedDomains.includes(normalized.split('@')[1] ?? '');
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'salasar-welfare-default-jwt-secret-2026',
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Direct Sign In',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const defaultEmail =
          allowedEmails[0] ?? (allowedDomains[0] ? `officer@${allowedDomains[0]}` : 'officer@salasartechno.com');
        const email = credentials?.email?.trim() || defaultEmail;
        return {
          id: 'default-user',
          name: 'Welfare Officer',
          email,
          image: null,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'select_account',
          // Hint Google's account chooser toward the company domain when there is exactly one.
          ...(allowedDomains.length === 1 ? { hd: allowedDomains[0] } : {}),
        },
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'credentials') return true;
      const googleProfile = profile as { email?: string; email_verified?: boolean } | undefined;
      return Boolean(googleProfile?.email_verified) && isEmailAllowed(googleProfile?.email);
    },
  },
};
