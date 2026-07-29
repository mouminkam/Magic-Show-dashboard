/**
 * Presentation formatting. Money defaults to AED because that is the store's
 * base currency in the settings seed; pass a code to override.
 */

const MONEY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'SAR',
  KWD: 'KWD',
};

export function formatMoney(amount: number | null | undefined, currency = 'AED'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  const symbol = MONEY_SYMBOLS[currency] ?? currency;
  const body = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return symbol.length > 1 ? `${symbol} ${body}` : `${symbol}${body}`;
}

/** Money without cents — for KPI tiles and chart axes. */
export function formatMoneyShort(amount: number | null | undefined, currency = 'AED'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  const symbol = MONEY_SYMBOLS[currency] ?? currency;
  return `${symbol} ${formatCompact(amount)}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-US');
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs < 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (abs < 1_000_000) {
    const n = value / 1000;
    return `${n.toFixed(abs % 1000 === 0 ? 0 : 1)}K`;
  }
  const n = value / 1_000_000;
  return `${n.toFixed(abs % 1_000_000 === 0 ? 0 : 2)}M`;
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** `2026-07-27` — the value shape an <input type="date"> expects. */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return '—';
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return '—';
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

/** `snake_case` / `kebab-case` -> `Title Case`. */
export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
