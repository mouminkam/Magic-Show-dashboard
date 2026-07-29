/**
 * Deterministic pseudo-randomness. The whole seed is reproducible so the demo
 * looks identical on every machine — and so charts don't reshuffle on reload.
 */

export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private readonly next: () => number;

  constructor(seed: number) {
    this.next = createRng(seed);
  }

  /** Float in [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }

  bool(trueProbability = 0.5): boolean {
    return this.next() < trueProbability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick called with an empty list');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Pick `count` distinct items (or all of them if the list is shorter). */
  sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items];
    const out: T[] = [];
    const take = Math.min(count, pool.length);
    for (let i = 0; i < take; i += 1) {
      const idx = this.int(0, pool.length - 1);
      out.push(pool.splice(idx, 1)[0] as T);
    }
    return out;
  }

  /** Weighted pick: `[value, weight]` pairs. */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.float(0, total);
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return value;
    }
    return entries[entries.length - 1]![0];
  }

  /** Round to 2dp — money never carries float noise into the store. */
  money(min: number, max: number): number {
    return Math.round(this.float(min, max) * 100) / 100;
  }

  /** A date between `daysAgoMax` and `daysAgoMin` days before `now`. */
  dateWithin(daysAgoMax: number, daysAgoMin = 0, now = Date.now()): Date {
    const days = this.float(daysAgoMin, daysAgoMax);
    const jitterMs = this.float(0, 86_400_000);
    return new Date(now - days * 86_400_000 - jitterMs);
  }
}

export function iso(date: Date): string {
  return date.toISOString();
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}
