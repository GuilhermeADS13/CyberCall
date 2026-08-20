import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("rate limiter", () => {
  it("allows up to the limit inside one window", () => {
    const limiter = createRateLimiter(3, 1000);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 10).allowed).toBe(true);
    expect(limiter.check("a", 20).allowed).toBe(true);
    expect(limiter.check("a", 30).allowed).toBe(false);
  });

  it("reports how long the caller has to wait", () => {
    const limiter = createRateLimiter(1, 1000);
    limiter.check("a", 0);
    expect(limiter.check("a", 400)).toEqual({
      allowed: false,
      retryAfterMs: 600,
    });
  });

  it("starts a fresh window once the previous one expires", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 500).allowed).toBe(false);
    expect(limiter.check("a", 1000).allowed).toBe(true);
  });

  it("keeps separate counters per key", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 0).allowed).toBe(false);
  });

  it("prunes expired buckets so the map does not grow forever", () => {
    const limiter = createRateLimiter(5, 1000);
    for (let index = 0; index < 50; index++) limiter.check(`key-${index}`, 0);
    expect(limiter.size()).toBe(50);
    limiter.check("late", 5000);
    expect(limiter.size()).toBe(1);
  });

  it("clears every bucket on reset", () => {
    const limiter = createRateLimiter(1, 1000);
    limiter.check("a", 0);
    limiter.reset();
    expect(limiter.size()).toBe(0);
    expect(limiter.check("a", 0).allowed).toBe(true);
  });
});
