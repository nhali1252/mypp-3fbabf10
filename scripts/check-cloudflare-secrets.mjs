#!/usr/bin/env node
/**
 * Pre-deploy check for Cloudflare Worker secrets/vars.
 *
 * Verifies that:
 *   1. wrangler config (wrangler.jsonc / wrangler.toml) declares the required
 *      public `vars` (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY).
 *   2. The required SECRETS (SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY) are either:
 *        - present in the local environment (CI/local), OR
 *        - listed by `wrangler secret list` if the wrangler CLI is available
 *          and authenticated.
 *
 * Exits non-zero (and prints a clear, actionable message) when something is
 * missing, so it can be wired into a `predeploy` / `prepublish` script.
 *
 * Usage:
 *   node scripts/check-cloudflare-secrets.mjs            # strict
 *   node scripts/check-cloudflare-secrets.mjs --warn     # warn-only (exit 0)
 */

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const REQUIRED_VARS = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"];
const REQUIRED_SECRETS = ["SUPABASE_SERVICE_ROLE_KEY", "LOVABLE_API_KEY"];

const warnOnly = process.argv.includes("--warn");
const root = process.cwd();

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function loadWranglerConfig() {
  const jsoncPath = path.join(root, "wrangler.jsonc");
  const jsonPath = path.join(root, "wrangler.json");
  const tomlPath = path.join(root, "wrangler.toml");

  if (existsSync(jsoncPath) || existsSync(jsonPath)) {
    const file = existsSync(jsoncPath) ? jsoncPath : jsonPath;
    const raw = readFileSync(file, "utf8");
    // strip // and /* */ comments for JSONC
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    try {
      return { file, config: JSON.parse(stripped) };
    } catch (err) {
      throw new Error(`Failed to parse ${file}: ${err.message}`);
    }
  }

  if (existsSync(tomlPath)) {
    const raw = readFileSync(tomlPath, "utf8");
    // very small TOML extractor — only need the [vars] table keys
    const vars = {};
    const varsMatch = raw.match(/\[vars\]([\s\S]*?)(?:\n\[|$)/);
    if (varsMatch) {
      for (const line of varsMatch[1].split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
        if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
    return { file: tomlPath, config: { vars } };
  }

  throw new Error("No wrangler.jsonc / wrangler.json / wrangler.toml found.");
}

function tryWranglerSecretList() {
  try {
    const out = execSync("npx --no-install wrangler secret list --format=json", {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 15_000,
    }).toString();
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed.map((s) => s.name) : null;
  } catch {
    return null; // wrangler not installed or not authenticated — ignore
  }
}

function main() {
  console.log(c.bold("\n🔐 Cloudflare deploy preflight\n"));

  const errors = [];
  const warnings = [];

  // 1. wrangler config vars
  let wrangler;
  try {
    wrangler = loadWranglerConfig();
    console.log(`• wrangler config: ${c.cyan(path.relative(root, wrangler.file))}`);
  } catch (err) {
    console.error(c.red(`✖ ${err.message}`));
    process.exit(warnOnly ? 0 : 1);
  }

  const declaredVars = Object.keys(wrangler.config.vars ?? {});
  for (const name of REQUIRED_VARS) {
    if (declaredVars.includes(name)) {
      console.log(`  ${c.green("✓")} var ${name} declared`);
    } else {
      errors.push(
        `Missing public var "${name}" in ${path.basename(wrangler.file)}.\n` +
          `   → Add it under "vars" in your wrangler config.`,
      );
    }
  }

  // 2. required secrets
  const remoteSecrets = tryWranglerSecretList();
  if (remoteSecrets) {
    console.log(`• wrangler secret list: ${c.cyan(`${remoteSecrets.length} secret(s) found`)}`);
  } else {
    console.log(
      `• wrangler secret list: ${c.yellow("unavailable")} (wrangler not authenticated — falling back to local env)`,
    );
  }

  for (const name of REQUIRED_SECRETS) {
    const inEnv = Boolean(process.env[name]);
    const inRemote = remoteSecrets?.includes(name);

    if (inRemote) {
      console.log(`  ${c.green("✓")} secret ${name} present on Cloudflare`);
    } else if (inEnv) {
      console.log(`  ${c.green("✓")} secret ${name} present in local env`);
    } else if (remoteSecrets) {
      errors.push(
        `Missing secret "${name}" on Cloudflare.\n` +
          `   → Add it via:  npx wrangler secret put ${name}\n` +
          `   → Or in the Cloudflare dashboard: Workers → your worker → Settings → Variables and Secrets.`,
      );
    } else {
      warnings.push(
        `Could not verify secret "${name}" remotely. Make sure it is configured in Cloudflare before deploying.\n` +
          `   → Add via:  npx wrangler secret put ${name}`,
      );
    }
  }

  // 3. report
  if (warnings.length) {
    console.log("");
    for (const w of warnings) console.log(c.yellow(`⚠ ${w}`));
  }

  if (errors.length) {
    console.log("");
    for (const e of errors) console.log(c.red(`✖ ${e}`));
    console.log(
      c.red(
        `\n${errors.length} problem(s) found. Fix them before publishing, or pass --warn to bypass.\n`,
      ),
    );
    process.exit(warnOnly ? 0 : 1);
  }

  console.log(c.green("\n✓ Cloudflare secrets preflight passed.\n"));
}

main();
