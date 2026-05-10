import { useQuery } from '@tanstack/react-query';
import api, { TOKEN_KEY } from '../lib/axios';

interface User {
  id: number;
  email: string;
  role: string;
}

export default function useAuth() {
  const query = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/me');
      return data.user;
    },
    enabled: !!localStorage.getItem(TOKEN_KEY),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
