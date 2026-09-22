import { HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-white shadow-card">
        <HeartHandshake className="size-5" aria-hidden />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-ink">HR Welfare</span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Salasar Techno</span>
        </span>
      )}
    </div>
  );
}
