export const fmt = (n: number): string =>
  Math.round(n).toLocaleString('ru-RU');

export const fmtCurrency = (n: number): string =>
  `${fmt(n)} ₽`;

export const fmtPercent = (n: number, decimals = 1): string =>
  `${n.toFixed(decimals).replace('.', ',')}%`;

export const fmtShort = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}М`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}к`;
  return String(Math.round(n));
};

export const safe = (n: number): number =>
  isFinite(n) && !isNaN(n) ? n : 0;

export const safeDivide = (a: number, b: number): number =>
  b !== 0 ? a / b : 0;

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
