#!/usr/bin/env node
/**
 * Lightweight sanity check (no test framework needed).
 * Greps PageLoader.tsx for the configured default timings and exits non-zero
 * if they drift from the expected value.
 *
 * Usage:  node scripts/check-page-loader-timings.mjs [expectedMs]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, "../src/components/PageLoader.tsx");
const expected = Number(process.argv[2] ?? 4000);

const src = readFileSync(file, "utf8");
const initial = src.match(/initialMs\s*=\s*(\d+)/);
const route = src.match(/routeMs\s*=\s*(\d+)/);

const fail = (msg) => {
  console.error(`\u274c  ${msg}`);
  process.exit(1);
};

if (!initial) fail("Could not find initialMs default in PageLoader.tsx");
if (!route) fail("Could not find routeMs default in PageLoader.tsx");

const initialMs = Number(initial[1]);
const routeMs = Number(route[1]);

if (initialMs !== expected) fail(`initialMs is ${initialMs}, expected ${expected}`);
if (routeMs !== expected) fail(`routeMs is ${routeMs}, expected ${expected}`);
if (initialMs !== routeMs) fail(`initialMs (${initialMs}) and routeMs (${routeMs}) must match`);

console.log(`\u2705  PageLoader timings OK \u2014 initialMs=${initialMs}, routeMs=${routeMs}`);
