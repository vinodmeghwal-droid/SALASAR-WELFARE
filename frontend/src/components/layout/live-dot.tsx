import { cn } from '@/lib/cn';

type State = 'live' | 'connecting' | 'offline' | 'syncing' | 'error';

const COLOR: Record<State, string> = {
  live: 'bg-good',
  syncing: 'bg-accent',
  connecting: 'bg-warning',
  offline: 'bg-muted',
  error: 'bg-critical',
};

export function LiveDot({ state }: { state: State }) {
  const pulse = state === 'live' || state === 'syncing';
  return (
    <span className="relative flex size-2" aria-hidden>
      {pulse && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', COLOR[state])} />}
      <span className={cn('relative inline-flex size-2 rounded-full', COLOR[state])} />
    </span>
  );
}
