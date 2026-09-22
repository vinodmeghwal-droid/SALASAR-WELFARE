'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/providers/toast-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig value={{ fetcher, keepPreviousData: true, revalidateOnFocus: true, errorRetryCount: 3 }}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
