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

/** Fails closed: with both allowlists empty, nobody can sign in. */
export function isEmailAllowed(email?: string | null) {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return allowedEmails.includes(normalized) || allowedDomains.includes(normalized.split('@')[1] ?? '');
}

/**
 * Password-less "Direct Sign In" — a local-development convenience until Google OAuth is
 * configured. Needs ENABLE_DIRECT_SIGNIN=true and is always off in production builds.
 */
export const directSignInEnabled =
  process.env.ENABLE_DIRECT_SIGNIN === 'true' && process.env.NODE_ENV !== 'production';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    ...(directSignInEnabled
      ? [
          CredentialsProvider({
            id: 'credentials',
            name: 'Direct Sign In (development)',
            credentials: {
              email: { label: 'Email', type: 'email' },
            },
            async authorize(credentials) {
              // Still restricted to the allowlist; defaults to its first address.
              const email = credentials?.email?.trim().toLowerCase() || allowedEmails[0];
              if (!isEmailAllowed(email)) return null;
              return { id: email, name: 'Welfare Officer', email, image: null };
            },
          }),
        ]
      : []),
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
      if (account?.provider === 'credentials') return directSignInEnabled; // authorize() already checked the allowlist
      const googleProfile = profile as { email?: string; email_verified?: boolean } | undefined;
      return Boolean(googleProfile?.email_verified) && isEmailAllowed(googleProfile?.email);
    },
  },
};
