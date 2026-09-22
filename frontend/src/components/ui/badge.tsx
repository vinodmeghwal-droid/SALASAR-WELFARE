import { CircleCheck, CircleDashed, CircleX, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Tone = 'good' | 'warning' | 'critical' | 'neutral' | 'accent';

const TONE: Record<Tone, string> = {
  good: 'bg-good-soft text-good-ink',
  warning: 'bg-warning-soft text-warning-ink',
  critical: 'bg-critical-soft text-critical-ink',
  neutral: 'bg-surface-2 text-ink-2',
  accent: 'bg-accent-soft text-accent-ink',
};

const ICON: Partial<Record<Tone, React.ComponentType<{ className?: string }>>> = {
  good: CircleCheck,
  warning: TriangleAlert,
  critical: CircleX,
  neutral: CircleDashed,
};

/** Status colors always ship with an icon + text, never color alone. */
export function Badge({
  tone = 'neutral',
  children,
  icon = true,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}) {
  const Icon = icon ? ICON[tone] : undefined;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
        TONE[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  );
}

/** Maps free-text sheet statuses ("Complied", "Yes", "Satisfactory", "Pending"…) to a tone. */
export function toneForStatus(value: unknown): Tone {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return 'neutral';
  if (/^(not|non|no|n)\b|unsatisf|poor|fail/.test(text)) return 'critical';
  if (/partial|pending|due|progress|average|needs/.test(text)) return 'warning';
  if (/^(complied|compliant|yes|y|satisfactory|good|ok|available|done)\b/.test(text)) return 'good';
  return 'neutral';
}
