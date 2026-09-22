import { ClipboardList, HeartHandshake, type LucideIcon } from 'lucide-react';

/**
 * Dashboard modules and their sub-topics. Add a sub-topic here and create
 * src/app/(dashboard)/<module>/<subtopic>/page.tsx — the sidebar picks it up.
 */
export interface SubTopic {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface DashboardModule {
  slug: string;
  label: string;
  icon: LucideIcon;
  subTopics: SubTopic[];
}

export const MODULES: DashboardModule[] = [
  {
    slug: 'hr-welfare',
    label: 'HR Welfare',
    icon: HeartHandshake,
    subTopics: [
      {
        slug: 'officer-return',
        label: 'Officer Return',
        description: 'Monthly Welfare Officer Return — manpower, facilities, health, safety, grievances & compliance',
        icon: ClipboardList,
      },
    ],
  },
];

export function findSubTopic(moduleSlug: string, subTopicSlug: string) {
  const mod = MODULES.find((m) => m.slug === moduleSlug);
  return { module: mod, subTopic: mod?.subTopics.find((s) => s.slug === subTopicSlug) };
}
