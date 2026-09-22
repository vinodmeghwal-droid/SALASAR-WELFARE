'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'motion/react';
import { ChartColumn, LoaderCircle, RefreshCw, ShieldCheck, TriangleAlert, UserCheck } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

const ERRORS: Record<string, string> = {
  AccessDenied: 'This account is not authorised for the HR Welfare dashboard.',
  OAuthSignin: 'Could not start Google sign-in. Please try again.',
  OAuthCallback: 'Google sign-in was interrupted. Please try again.',
  Configuration: 'Google sign-in is not configured yet. Contact the administrator.',
  CredentialsSignin: 'Direct sign-in is only available for authorised accounts.',
  Default: 'Sign-in failed. Please try again.',
};

const FEATURES = [
  { icon: ChartColumn, text: 'Monthly & annual welfare analytics' },
  { icon: RefreshCw, text: 'Live sync with the Google Drive workbook' },
  { icon: ShieldCheck, text: 'Authorised accounts only' },
];

export function LoginCard({
  callbackUrl,
  error,
  directSignIn,
}: {
  callbackUrl: string;
  error?: string;
  directSignIn: boolean;
}) {
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleDirectSignIn = async () => {
    setLoadingDirect(true);
    await signIn('credentials', { callbackUrl });
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    await signIn('google', { callbackUrl });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-pop sm:p-10"
    >
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-2">Sign in to view the Welfare Officer Return dashboard.</p>

      {error && (
        <div role="alert" className="mt-6 flex gap-2.5 rounded-lg bg-critical-soft p-3 text-sm text-critical-ink">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{ERRORS[error] ?? ERRORS.Default}</span>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={loadingDirect || loadingGoogle}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-line-strong bg-surface text-sm font-medium text-ink transition hover:bg-surface-2 active:scale-[0.99] disabled:opacity-70"
        >
          {loadingGoogle ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <GoogleMark />}
          {loadingGoogle ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>

        {directSignIn && (
          <>
            <button
              onClick={handleDirectSignIn}
              disabled={loadingDirect || loadingGoogle}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-70"
            >
              {loadingDirect ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <UserCheck className="size-4" aria-hidden />
              )}
              {loadingDirect ? 'Signing in…' : 'Direct sign-in'}
            </button>
            <p className="text-center text-xs text-muted">
              Development only — disabled in production builds.
            </p>
          </>
        )}
      </div>

      <ul className="mt-8 space-y-2.5 border-t border-line pt-6">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5 text-sm text-ink-2">
            <Icon className="size-4 text-accent" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.95l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
