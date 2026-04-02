import { useQuery } from '@apollo/client';
import { GET_CATEGORIES } from '../graphql/queries/business';
import type { Category } from '../types/api';

export function useCategories() {
  const { data, loading, error } = useQuery(GET_CATEGORIES, {
    fetchPolicy: 'cache-first',
    variables: { limit: 100, offSet: 0 },
  });
  const categories: Category[] = data?.getAllCategories?.categories || [];
  return { categories, loading, error };
}
