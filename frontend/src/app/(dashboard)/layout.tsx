import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defence in depth — proxy.ts already redirects anonymous requests.
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return <DashboardShell>{children}</DashboardShell>;
}
