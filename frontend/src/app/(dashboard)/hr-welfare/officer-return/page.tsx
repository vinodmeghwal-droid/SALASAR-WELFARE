import type { Metadata } from 'next';
import { OfficerReturnDashboard } from '@/features/officer-return/officer-return-dashboard';
import { parsePeriod } from '@/features/officer-return/periods';

export const metadata: Metadata = { title: 'Officer Return' };

export default async function OfficerReturnPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  return <OfficerReturnDashboard initialPeriod={parsePeriod(period)} />;
}
