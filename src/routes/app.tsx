import { Outlet, createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/auth-guards";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}
