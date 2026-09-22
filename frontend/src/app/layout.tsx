import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { themeInitScript } from '@/providers/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'HR Welfare', template: '%s · HR Welfare' },
  description: 'Salasar HR Welfare dashboard — Welfare Officer Return analytics, synced live from Google Drive.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f4f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
