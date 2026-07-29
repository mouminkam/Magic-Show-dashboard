/**
 * Placeholder imagery generated as inline SVG data URIs.
 *
 * The console is offline-only, so it can never reach a CDN for product shots.
 * Rather than shipping grey boxes we render a deterministic two-stop gradient
 * tile with the item's monogram — reads as art direction, not as a broken img.
 */

const PALETTES: readonly (readonly [string, string])[] = [
  ['#2f2a4a', '#5b45e0'],
  ['#123833', '#0d9488'],
  ['#3a2413', '#d97706'],
  ['#3b1230', '#db2777'],
  ['#10233f', '#2563eb'],
  ['#22320f', '#65a30d'],
  ['#38222c', '#9f1239'],
  ['#1d2b34', '#0e7490'],
  ['#2e2718', '#a16207'],
  ['#241a37', '#7c3aed'],
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function monogram(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'MS';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
}

function encode(svg: string): string {
  // encodeURIComponent keeps this safe for any label and avoids base64 bloat.
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

/** Square product/blog tile. `variant` shifts the palette for gallery shots. */
export function tileImage(label: string, variant = 0, size = 400): string {
  const h = hash(`${label}::${variant}`);
  const [from, to] = PALETTES[h % PALETTES.length]!;
  const angle = (h % 4) * 45;
  const text = monogram(label);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#g)"/>
      <circle cx="${300 + (h % 40)}" cy="${90 + (h % 60)}" r="${70 + (h % 50)}"
              fill="#ffffff" fill-opacity="0.07"/>
      <circle cx="${80 + (h % 50)}" cy="${330 - (h % 40)}" r="${50 + (h % 40)}"
              fill="#000000" fill-opacity="0.10"/>
      <text x="200" y="200" text-anchor="middle" dominant-baseline="central"
            font-family="Geist Variable, system-ui, sans-serif" font-size="120"
            font-weight="600" fill="#ffffff" fill-opacity="0.86"
            letter-spacing="4">${text}</text>
    </svg>`;
  return encode(svg);
}

/** Wide 16:9 banner for blog covers and CMS hero previews. */
export function bannerImage(label: string, variant = 0): string {
  const h = hash(`${label}::banner::${variant}`);
  const [from, to] = PALETTES[h % PALETTES.length]!;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#g)"/>
      <path d="M0 420 Q 240 ${300 + (h % 120)} 480 400 T 960 360 V540 H0 Z"
            fill="#ffffff" fill-opacity="0.08"/>
      <text x="60" y="470" font-family="Geist Variable, system-ui, sans-serif"
            font-size="46" font-weight="600" fill="#ffffff" fill-opacity="0.9">
        ${label.slice(0, 34).replace(/[<>&]/g, '')}
      </text>
    </svg>`;
  return encode(svg);
}

/** Round avatar used for customers, team and admin users. */
export function avatarImage(name: string): string {
  const h = hash(`avatar::${name}`);
  const [from, to] = PALETTES[h % PALETTES.length]!;
  const text = monogram(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#g)"/>
      <text x="80" y="80" text-anchor="middle" dominant-baseline="central"
            font-family="Geist Variable, system-ui, sans-serif" font-size="62"
            font-weight="600" fill="#ffffff" fill-opacity="0.92">${text}</text>
    </svg>`;
  return encode(svg);
}
