import type { Metadata } from 'next';
import { AccidentTrackerDashboard } from '@/features/accident-tracker/accident-tracker-dashboard';

export const metadata: Metadata = { title: 'Accident Tracker' };

export default async function AccidentTrackerPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  return <AccidentTrackerDashboard initialPeriod={period ?? 'annual'} />;
}
