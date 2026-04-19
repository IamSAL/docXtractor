import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { setQueryCacheClearer } from "@/lib/auth-store";

let _queryClient: QueryClient | null = null;

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 800,
        gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });
  _queryClient = queryClient;
  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  // Register the query cache clearer so auth-store can clear cache on logout
  useEffect(() => {
    _queryClient = queryClient;
    setQueryCacheClearer(() => {
      queryClient.clear();
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
