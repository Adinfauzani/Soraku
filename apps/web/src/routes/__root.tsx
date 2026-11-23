import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchModal } from "@/components/layout/SearchModal";

function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Sidebar />
      <main className="min-h-screen pb-16 lg:pb-0 lg:pl-14 bg-background">
        <Outlet />
      </main>
      <MobileNav />
      <SearchModal />
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});