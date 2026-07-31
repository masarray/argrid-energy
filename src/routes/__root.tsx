import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Link, Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { WorkspaceState } from "@/components/argrid-ui";
import { DemoSimulationProvider } from "@/lib/demo-simulation";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl">
        <WorkspaceState
eyebrow="Navigation"
title="Workspace not found"
description="The requested ArGrid route is not part of the current static demonstration. Return to the enterprise portfolio and continue from a governed workspace."
action={<Link to="/portfolio" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[11px] font-medium text-primary-foreground">Open portfolio</Link>}
        />
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => console.error(error), [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl">
        <WorkspaceState
eyebrow="Client-side recovery"
title="This workspace did not load"
description="The local demo encountered an unexpected client-side error. Retry the route first; no field command, external filing, or financial posting occurred."
tone="critical"
action={
  <div className="flex flex-wrap gap-2">
    <button type="button" onClick={() => { router.invalidate(); reset(); }} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[11px] font-medium text-primary-foreground">Retry workspace</button>
    <Link to="/portfolio" className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-[11px] font-medium">Portfolio</Link>
  </div>
}
        />
        <details className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-[10px] text-muted-foreground">
<summary className="cursor-pointer font-medium text-foreground">Technical detail</summary>
<pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[9.5px]">{error.message}</pre>
        </details>
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
