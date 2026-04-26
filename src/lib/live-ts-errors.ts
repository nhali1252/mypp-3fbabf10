import { useSyncExternalStore } from "react";
import { parseTscOutput, type TsError } from "@/lib/build-info";

/**
 * In-memory store of TypeScript / build errors observed by the running page,
 * tagged by source (live editor surface vs. dev server / HMR vs. last build).
 *
 * Build errors come from the static manifest; this store handles the *live*
 * sources (editor + dev-server) by listening to window error events that
 * Vite and the runtime emit while the user is browsing.
 */

let errors: TsError[] = [];
const listeners = new Set<() => void>();
let installed = false;

function notify() {
  // Snapshot reference must change for useSyncExternalStore to re-render.
  errors = [...errors];
  for (const l of listeners) l();
}

function add(next: TsError[]) {
  if (next.length === 0) return;
  // De-dupe by file:line:col:code:message (drop source so editor + dev
  // duplicates of the same problem coalesce, keeping the first source).
  const key = (e: TsError) => `${e.file}:${e.line}:${e.column}:${e.code}:${e.message}`;
  const seen = new Set(errors.map(key));
  const fresh = next.filter((e) => !seen.has(key(e)));
  if (fresh.length === 0) return;
  errors = [...errors, ...fresh].slice(-200); // bound the buffer
  notify();
}

export function clearLiveErrors() {
  if (errors.length === 0) return;
  errors = [];
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureInstalled();
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return errors;
}

function getServerSnapshot(): TsError[] {
  return [];
}

/**
 * React hook returning the current list of live (editor/dev-server) errors.
 * Build errors are NOT included here — those live in the manifest.
 */
export function useLiveTsErrors(): TsError[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ---------- listeners ---------- */

function ensureInstalled() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Vite emits a structured error object on HMR / overlay errors.
  // We treat these as "dev-server" since they originate from the dev pipeline.
  if (import.meta.hot) {
    import.meta.hot.on("vite:error", (payload: unknown) => {
      const err = (payload as { err?: { message?: string; loc?: { file?: string; line?: number; column?: number } } }).err;
      if (!err) return;
      const file = err.loc?.file ?? "unknown";
      const line = err.loc?.line ?? 0;
      const column = err.loc?.column ?? 0;
      add([
        {
          id: `dev:${file}:${line}:${column}:${Date.now()}`,
          source: "dev-server",
          file: stripProjectRoot(file),
          line,
          column,
          message: err.message ?? "Vite reported an error",
          observedAt: new Date().toISOString(),
        },
      ]);
    });
  }

  // Runtime errors surface in the editor preview pane — tag as "editor".
  window.addEventListener("error", (event) => {
    // Try to parse a tsc-style line out of the message; fall back to the raw error.
    const fromTsc = parseTscOutput(event.message, new Date().toISOString(), "editor");
    if (fromTsc.length > 0) {
      add(fromTsc);
      return;
    }
    if (!event.message) return;
    add([
      {
        id: `editor:${event.filename ?? "?"}:${event.lineno ?? 0}:${event.colno ?? 0}:${Date.now()}`,
        source: "editor",
        file: stripProjectRoot(event.filename ?? "unknown"),
        line: event.lineno ?? 0,
        column: event.colno ?? 0,
        message: event.message,
        observedAt: new Date().toISOString(),
      },
    ]);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = typeof reason === "string" ? reason : reason?.message;
    if (!message) return;
    const fromTsc = parseTscOutput(message, new Date().toISOString(), "editor");
    if (fromTsc.length > 0) {
      add(fromTsc);
      return;
    }
    add([
      {
        id: `editor:rejection:${Date.now()}`,
        source: "editor",
        file: "unknown",
        line: 0,
        column: 0,
        message,
        observedAt: new Date().toISOString(),
      },
    ]);
  });
}

function stripProjectRoot(file: string): string {
  // Vite often gives absolute paths; trim everything before /src/ for display.
  if (!file) return "unknown";
  const idx = file.indexOf("/src/");
  if (idx >= 0) return file.slice(idx + 1);
  // Strip file:// scheme + url params.
  return file.replace(/^file:\/\//, "").replace(/\?.*$/, "");
}
