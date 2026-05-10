import { Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";
import { RouteTransition } from "@/components/RouteTransition";
import { SiteHead } from "@/components/SiteHead";
import { PageViewTracker } from "@/components/PageViewTracker";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MotionPrefProvider } from "@/components/MotionPrefProvider";
import { StaleBuildBanner } from "@/components/dev/StaleBuildBanner";
import { HeadingShimmerVars } from "@/components/HeadingShimmerVars";
import { ShimmerToggle } from "@/components/ShimmerToggle";


import appCss from "../styles.css?url";

// Inline script that runs before React hydrates so the right theme class
// is set on <html> on first paint and we never flash the wrong colors.
const themeBootScript = `(() => {
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'dark' && t !== 'light') {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    var r = document.documentElement;
    r.classList.add(t);
    r.style.colorScheme = t;
  } catch (e) {}
})();`;

// Apply the saved shimmer preference before hydration so visitors who
// disabled the gold shimmer never see a one-frame flash on first paint.
const shimmerBootScript = `(() => {
  try {
    if (localStorage.getItem('shimmer-pref') === 'off') {
      document.documentElement.setAttribute('data-shimmer-user', 'off');
    }
  } catch (e) {}
})();`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Ali Nur Hasan" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0F172A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Ali Nur Hasan" },
      // Note: per-route head() supplies title, description, og:title,
      // og:description, og:image, twitter:title, twitter:description,
      // twitter:image via buildSeoMeta(). Don't add fallbacks here —
      // root meta is concatenated into every match and would override
      // leaf og:image for routes that don't set their own.
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Inter:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600;700&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icons/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icons/icon-512.png" },
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "Ali Nur Hasan — RSS feed",
        href: "/feed.xml",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: shimmerBootScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Avoid noisy refetch flickers when switching tabs/windows.
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MotionPrefProvider>
          <AuthProvider>
            <SiteHead />
            <HeadingShimmerVars />
            <PageViewTracker />
            <PageLoader />
            <MaintenanceGate>
              <RouteTransition />
            </MaintenanceGate>
            <Toaster richColors position="top-right" />
              <StaleBuildBanner />
            {/* Floating per-user shimmer toggle — visible on every page,
                hidden on /admin/* (the AdminLayout sets data-admin and the
                admin chrome already has its own shimmer controls). */}
            <div className="pointer-events-none fixed bottom-4 right-4 z-40 print:hidden [body:has([data-admin])_&]:hidden">
              <div className="pointer-events-auto">
                <ShimmerToggle />
              </div>
            </div>
          </AuthProvider>
        </MotionPrefProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
