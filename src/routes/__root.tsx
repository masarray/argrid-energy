import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Link, Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { DemoSimulationProvider } from "@/lib/demo-simulation";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-display text-6xl font-medium text-foreground">404</div>
        <h1 className="mt-4 text-xl font-medium text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The requested ArGrid workspace does not exist.</p>
        <Link to="/" className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Return to overview
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => console.error(error), [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-medium tracking-tight text-foreground">This workspace did not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">The local demo encountered an unexpected client-side error.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
          <Link to="/" className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium">
            Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { title: "ArGrid Energy Management System" },
      { name: "description", content: "Open-source industrial energy management system demonstration." },
      { name: "author", content: "ArGrid open-source contributors" },
      { name: "theme-color", content: "#181c1f" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <DemoSimulationProvider>
        <HeadContent />
        <Outlet />
      </DemoSimulationProvider>
    </QueryClientProvider>
  );
}
