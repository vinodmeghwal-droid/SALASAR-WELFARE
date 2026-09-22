'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/providers/theme-provider';

const NEXT: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' };
const ICON = { light: Sun, dark: Moon, system: Monitor };
const LABEL = { light: 'Light theme', dark: 'Dark theme', system: 'System theme' };

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const Icon = ICON[preference];
  return (
    <button
      onClick={() => setPreference(NEXT[preference])}
      className="grid size-9 place-items-center rounded-lg text-ink-2 transition hover:bg-surface-2 hover:text-ink"
      aria-label={`${LABEL[preference]} — switch to ${LABEL[NEXT[preference]].toLowerCase()}`}
      title={LABEL[preference]}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}
