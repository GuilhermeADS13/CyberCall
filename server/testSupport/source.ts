import { readFileSync } from "node:fs";

/**
 * Some suites assert that a screen still wires up a given control by looking at
 * its source text. Collapsing whitespace keeps those checks meaningful without
 * making them fail every time the formatter rewraps a line.
 *
 * These are smoke checks, not behaviour tests: prefer exercising the exported
 * helpers directly whenever the behaviour can be reached from a function.
 */
export function readNormalizedSource(relativePath: string, base: string | URL) {
  return readFileSync(new URL(relativePath, base), "utf8").replace(/\s+/g, " ");
}

export function snippet(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
