'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { MODULES } from '@/config/navigation';
import { Logo } from '@/components/brand/logo';
import { SyncStatusCard } from './sync-status-card';
import { cn } from '@/lib/cn';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboards">
        {MODULES.map((mod) => {
          const moduleActive = pathname.startsWith(`/${mod.slug}`);
          return (
            <div key={mod.slug}>
              <div
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold',
                  moduleActive ? 'text-ink' : 'text-ink-2',
                )}
              >
                <mod.icon className="size-4 text-accent" aria-hidden />
                {mod.label}
              </div>
              <ul className="ml-[19px] mt-1 space-y-0.5 border-l border-line pl-3">
                {mod.subTopics.map((sub) => {
                  const href = `/${mod.slug}/${sub.slug}`;
                  const active = pathname.startsWith(href);
                  return (
                    <li key={sub.slug} className="relative">
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-lg bg-accent-soft"
                          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        />
                      )}
                      <Link
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                          active ? 'font-medium text-accent-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                        )}
                      >
                        <sub.icon className="size-4" aria-hidden />
                        {sub.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="p-3">
        <SyncStatusCard />
      </div>
    </div>
  );
}
