'use client';

import { useMemo } from 'react';
import { chartPalette } from '@/lib/chart-palette';
import { useTheme } from '@/providers/theme-provider';

/** Recharts needs literal colors (SVG presentation attributes can't read CSS vars). */
export function useChartPalette() {
  const { resolved } = useTheme();
  return useMemo(() => chartPalette(resolved), [resolved]);
}
