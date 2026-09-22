'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useSWRConfig } from 'swr';
import { CircleCheck, Lightbulb, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import { useInsights } from '@/hooks/use-officer-return';
import { endpoints, fetcher } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge, type Tone } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/states';
import { useToast } from '@/providers/toast-provider';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { InsightResponse, Period, Priority } from '@/types/officer-return';

const PRIORITY_TONE: Record<Priority, Tone> = { high: 'critical', medium: 'warning', low: 'neutral' };

/** Gemini's narrative analysis of the figures on the current view. Hidden when AI is not configured. */
export function AiInsightsCard({ period, className }: { period: Period; className?: string }) {
  const { data, error, isLoading } = useInsights(period);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [regenerating, setRegenerating] = useState(false);

  if (data && !data.enabled) return null;

  async function regenerate() {
    setRegenerating(true);
    try {
      const fresh = await fetcher<InsightResponse>(endpoints.insights(period, true));
      await mutate(endpoints.insights(period), fresh, { revalidate: false });
    } catch (e) {
      toast({ tone: 'error', title: 'Could not regenerate the analysis', description: (e as Error).message });
    } finally {
      setRegenerating(false);
    }
  }

  const busy = isLoading || regenerating;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* soft gradient wash marks this card as AI-generated */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent/[0.07] to-transparent"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-start gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#4a3aa7] to-accent text-white shadow-card">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
              AI analysis
              <Badge tone="accent" icon={false}>
                Gemini
              </Badge>
            </h3>
            <p className="mt-1 text-xs text-ink-2">
              {data?.enabled
                ? `Generated ${timeAgo(data.generatedAt)} from the figures on this page${data.cached ? ' · cached' : ''}`
                : 'Reads the figures on this page and summarises what needs attention'}
            </p>
          </div>
        </div>
        {data?.enabled && (
          <button
            onClick={regenerate}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-2 transition hover:text-ink disabled:opacity-60"
          >
            <RefreshCw className={cn('size-3.5', regenerating && 'animate-spin')} aria-hidden />
            {regenerating ? 'Analysing…' : 'Regenerate'}
          </button>
        )}
      </div>

      <div className="relative p-5">
        {busy && !data?.enabled ? (
          <AnalysingState />
        ) : error && !data ? (
          <p className="flex items-start gap-2 rounded-xl bg-warning-soft/70 p-3 text-sm text-ink-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden />
            <span>
              {error.message}{' '}
              <button onClick={regenerate} className="font-medium text-accent underline-offset-2 hover:underline">
                Try again
              </button>
            </span>
          </p>
        ) : data?.enabled ? (
          <motion.div
            key={data.generatedAt}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: regenerating ? 0.5 : 1, y: 0 }}
            className="space-y-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <HealthRing score={data.insight.healthScore} />
              <div className="min-w-0">
                <p className="text-base font-semibold leading-snug text-ink">{data.insight.headline}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{data.insight.summary}</p>
              </div>
            </div>

            {data.insight.keyMetrics.length > 0 && (
              <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {data.insight.keyMetrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-line bg-surface-2/50 px-3 py-2.5">
                    <dt className="text-[11px] font-medium text-muted">{m.label}</dt>
                    <dd className="mt-0.5 text-lg font-semibold tracking-tight text-ink">{m.value}</dd>
                    <dd className="text-[11px] leading-snug text-ink-2">{m.note}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <InsightColumn title="Going well" icon={CircleCheck} iconClass="text-good-ink">
                {data.insight.highlights.map((h) => (
                  <li key={h.title}>
                    <p className="text-sm font-medium text-ink">{h.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{h.detail}</p>
                  </li>
                ))}
              </InsightColumn>

              <InsightColumn title="Risks & data issues" icon={TriangleAlert} iconClass="text-warning-ink">
                {data.insight.risks.map((r) => (
                  <li key={r.title}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-medium text-ink">{r.title}</p>
                      <Badge tone={PRIORITY_TONE[r.severity]}>{r.severity}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{r.detail}</p>
                  </li>
                ))}
              </InsightColumn>

              <InsightColumn title="Recommended actions" icon={Lightbulb} iconClass="text-accent">
                {data.insight.recommendations.map((r, i) => (
                  <li key={r.action} className="flex gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium text-ink">{r.action}</p>
                        <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{r.rationale}</p>
                    </div>
                  </li>
                ))}
              </InsightColumn>
            </div>

            <p className="border-t border-line pt-3 text-[11px] text-muted">
              AI-generated from aggregated figures ({data.model}). Check against the charts before acting.
            </p>
          </motion.div>
        ) : null}
      </div>
    </Card>
  );
}

function InsightColumn({
  title,
  icon: Icon,
  iconClass,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line p-4">
      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">
        <Icon className={cn('size-3.5', iconClass)} aria-hidden />
        {title}
      </h4>
      <ul className="space-y-3">{children}</ul>
    </section>
  );
}

/** 0–100 score ring. Color bands are paired with the number and a word, never color alone. */
function HealthRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band =
    clamped >= 80
      ? { label: 'Healthy', color: 'var(--good)' }
      : clamped >= 60
        ? { label: 'Watch', color: 'var(--warning)' }
        : { label: 'At risk', color: 'var(--critical)' };
  const r = 30;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex shrink-0 items-center gap-3" role="meter" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label="AI health score">
      <svg viewBox="0 0 72 72" className="size-[72px] -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={band.color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="leading-tight">
        <p className="text-2xl font-semibold tracking-tight text-ink">
          {clamped}
          <span className="text-sm font-normal text-muted">/100</span>
        </p>
        <p className="text-xs text-ink-2">{band.label}</p>
      </div>
    </div>
  );
}

function AnalysingState() {
  return (
    <div aria-busy="true" className="space-y-4">
      <p className="flex items-center gap-2 text-sm text-ink-2">
        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}>
          <Sparkles className="size-4 text-accent" aria-hidden />
        </motion.span>
        Analysing the return with Gemini… this can take up to a minute when the service is busy.
      </p>
      <div className="flex items-center gap-4">
        <Skeleton className="size-[72px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
