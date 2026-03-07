import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrincipalStore } from './store/principalStore';

const queryClient = new QueryClient();

function App() {
  const fetchPrincipal = usePrincipalStore((state) => state.fetchPrincipal);

  useEffect(() => {
    fetchPrincipal();
  }, [fetchPrincipal]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
