import { Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";
import { RouteTransition } from "@/components/RouteTransition";
import { SiteHead } from "@/components/SiteHead";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StaleBuildBanner } from "@/components/dev/StaleBuildBanner";

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
      { title: "Ali Nur Hasan — BBA Marketing Student Portfolio" },
      {
        name: "description",
        content:
          "BBA 3rd-Year Marketing student at Habibullah Bahar College (National University). Portfolio of academic work, skills, and activities.",
      },
      { name: "author", content: "Ali Nur Hasan" },
      { property: "og:title", content: "Ali Nur Hasan — BBA Marketing Student Portfolio" },
      {
        property: "og:description",
        content: "Portfolio of academic work, skills, and activities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Ali Nur Hasan — BBA Marketing Student Portfolio" },
      { name: "description", content: "MY-V7 is a portfolio website application that allows users to manage and display their projects and personal information." },
      { property: "og:description", content: "MY-V7 is a portfolio website application that allows users to manage and display their projects and personal information." },
      { name: "twitter:description", content: "MY-V7 is a portfolio website application that allows users to manage and display their projects and personal information." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8064b1d7-871a-477a-b618-87007df00f10/id-preview-5772792c--7987935c-76fc-4499-851e-e85dd50daeb6.lovable.app-1776791998407.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8064b1d7-871a-477a-b618-87007df00f10/id-preview-5772792c--7987935c-76fc-4499-851e-e85dd50daeb6.lovable.app-1776791998407.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
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
        <AuthProvider>
          <SiteHead />
          <PageLoader />
          <RouteTransition />
          <Toaster richColors position="top-right" />
          <StaleBuildBanner />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
