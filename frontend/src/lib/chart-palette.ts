/**
 * Validated categorical palette (dataviz reference instance).
 * Slots are assigned in fixed order and never cycled; ≤ 4 series per chart here.
 * Dark steps are selected for the dark surface, not auto-inverted.
 */
export type ResolvedTheme = 'light' | 'dark';

const SERIES = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
} as const;

const CHROME = {
  light: { surface: '#fcfcfb', grid: '#e1e0d9', axis: '#c3c2b7', tick: '#7a7873', ink2: '#52514e', empty: '#f0efec' },
  dark: { surface: '#1a1a19', grid: '#2c2c2a', axis: '#383835', tick: '#9a9892', ink2: '#c3c2b7', empty: '#232322' },
} as const;

export function chartPalette(theme: ResolvedTheme) {
  return { series: SERIES[theme], ...CHROME[theme] };
}

export type ChartPalette = ReturnType<typeof chartPalette>;
