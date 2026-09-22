'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/cn';

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

export function Card({ className, children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn('rounded-2xl border border-line bg-surface shadow-card', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
            <Icon className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-tight tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-ink-2">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Groups several cards under a lettered heading matching the sheet (A. Manpower…). */
export function SectionHeading({ letter, title, description }: { letter?: string; title: string; description?: string }) {
  return (
    <motion.div variants={fadeUp} className="col-span-full mt-4 flex items-end gap-3 first:mt-0">
      {letter && (
        <span className="grid h-7 min-w-7 place-items-center rounded-md bg-ink px-1.5 text-xs font-bold text-surface">
          {letter}
        </span>
      )}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {description && <p className="text-sm text-ink-2">{description}</p>}
      </div>
    </motion.div>
  );
}
