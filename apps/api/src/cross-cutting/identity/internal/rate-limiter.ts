import { rateLimitExceededProblem } from '../../../shared/problem.js';

interface Bucket {
  count: number;
  resetAtMs: number;
}

const DEFAULT_MAX_BUCKETS = 10_000;

/**
 * Bounded fixed-window in-memory rate limiter for auth abuse protection (ADR-007 item 7).
 * Sweeps expired windows and evicts oldest keys when full so attacker-controlled keys
 * cannot grow heap memory without bound.
 */
export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly clock: () => Date;
  private readonly maxBuckets: number;

  constructor(clock: () => Date = () => new Date(), maxBuckets = DEFAULT_MAX_BUCKETS) {
    this.clock = clock;
    this.maxBuckets = maxBuckets;
  }

  consume(key: string, maxAttempts: number, windowMs: number): void {
    const nowMs = this.clock().getTime();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAtMs <= nowMs) {
      if (existing) {
        this.buckets.delete(key);
      }
      this.ensureCapacity(nowMs);
      this.buckets.set(key, { count: 1, resetAtMs: nowMs + windowMs });
      return;
    }

    if (existing.count >= maxAttempts) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - nowMs) / 1000));
      throw rateLimitExceededProblem(retryAfterSeconds);
    }

    existing.count += 1;
  }

  private ensureCapacity(nowMs: number): void {
    if (this.buckets.size < this.maxBuckets) {
      return;
    }
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAtMs <= nowMs) {
        this.buckets.delete(key);
      }
    }
    while (this.buckets.size >= this.maxBuckets) {
      const oldestKey = this.buckets.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.buckets.delete(oldestKey);
    }
  }
}
