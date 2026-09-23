'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, Menu, RefreshCw } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import { useSWRConfig } from 'swr';
import { MODULES } from '@/config/navigation';
import { triggerSync, isBackendKey } from '@/lib/api';
import { useToast } from '@/providers/toast-provider';
import { useLiveSync } from '@/providers/live-sync-provider';
import { initials } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ThemeToggle } from './theme-toggle';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const [, moduleSlug, subSlug] = pathname.split('/');
  const mod = MODULES.find((m) => m.slug === moduleSlug);
  const sub = mod?.subTopics.find((s) => s.slug === subSlug);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onOpenMenu}
          className="-ml-1 rounded-lg p-2 text-ink-2 hover:bg-surface-2 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="hidden text-ink-2 sm:block">{mod?.label ?? 'Dashboard'}</li>
            {sub && (
              <>
                <li aria-hidden className="hidden text-muted sm:block">
                  /
                </li>
                <li className="truncate font-semibold text-ink">{sub.label}</li>
              </>
            )}
          </ol>
        </nav>

        <SyncButton />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

function SyncButton() {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const { syncing: liveSyncing } = useLiveSync();
  const [busy, setBusy] = useState(false);
  const spinning = busy || liveSyncing;

  async function onClick() {
    setBusy(true);
    try {
      const { results } = await triggerSync(true);
      await mutate(isBackendKey);
      const failed = results.filter((r) => r.error);
      const updated = results.filter((r) => r.changedItems?.length).map((r) => r.label ?? r.dataset);
      toast(
        failed.length
          ? { tone: 'error', title: 'Some workbooks failed to sync', description: failed.map((f) => f.error).join(' · ') }
          : {
              tone: 'success',
              title: 'Synced with Google Drive',
              description: updated.length ? `Updated: ${updated.join(', ')}` : 'Already up to date',
            },
      );
    } catch (error) {
      toast({ tone: 'error', title: 'Sync failed', description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={spinning}
      className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-2 shadow-card transition hover:text-ink active:scale-[0.98] disabled:opacity-70"
      title="Fetch the latest workbook from Google Drive now"
    >
      <RefreshCw className={cn('size-4', spinning && 'animate-spin')} aria-hidden />
      <span className="hidden sm:inline">{spinning ? 'Syncing…' : 'Sync now'}</span>
    </button>
  );
}

function UserMenu() {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const user = data?.user;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg p-1 pr-1.5 hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="size-8 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
            {initials(user?.name)}
          </span>
        )}
        <ChevronDown className="hidden size-4 text-muted sm:block" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-xl border border-line bg-surface p-1.5 shadow-pop"
            >
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <div className="my-1 h-px bg-line" />
              <button
                role="menuitem"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
