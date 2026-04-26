import { Component, type ComponentType, type ReactNode } from "react";

/**
 * Minimal placeholder shown when LauncherSkeleton is missing or fails to load.
 * Keeps layout intact instead of crashing the page with a ReferenceError.
 */
export function LauncherSkeletonFallback() {
  return (
    <div
      role="status"
      aria-label="Loading launcher"
      className="w-full animate-pulse space-y-3 rounded-md border border-border/50 bg-muted/30 p-4"
    >
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

class SkeletonErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("[SafeLauncherSkeleton] LauncherSkeleton failed, using fallback:", error);
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

type SafeLauncherSkeletonProps = {
  /**
   * The real LauncherSkeleton component, if available. Pass it explicitly so
   * callers control resolution — if it's `undefined`/`null` (e.g. stale build
   * removed the export), we render the fallback instead of throwing.
   */
  Component?: ComponentType<Record<string, unknown>> | null;
  componentProps?: Record<string, unknown>;
};

export function SafeLauncherSkeleton({
  Component: LauncherSkeleton,
  componentProps,
}: SafeLauncherSkeletonProps) {
  if (typeof LauncherSkeleton !== "function") {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        "[SafeLauncherSkeleton] LauncherSkeleton is missing at runtime — rendering fallback.",
      );
    }
    return <LauncherSkeletonFallback />;
  }

  return (
    <SkeletonErrorBoundary fallback={<LauncherSkeletonFallback />}>
      <LauncherSkeleton {...(componentProps ?? {})} />
    </SkeletonErrorBoundary>
  );
}

export default SafeLauncherSkeleton;
