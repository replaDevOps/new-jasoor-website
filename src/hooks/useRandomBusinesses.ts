/**
 * useRandomBusinesses.ts
 * Fetches random businesses for the home page Listings section.
 * Mirrors OLD frontend ExploreLive.jsx — passes userId if logged in.
 */
import { useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_RANDOM_BUSINESSES } from '../graphql/queries/business';
import type { BusinessListItem } from '../types/api';

export function useRandomBusinesses(userId: string | null) {
  const [loadRandom, { data, loading }] = useLazyQuery(GET_RANDOM_BUSINESSES, {
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    loadRandom({ variables: { userId: userId ?? undefined } });
  }, [userId, loadRandom]);

  const businesses: BusinessListItem[] = data?.getRandomBusinesses || [];

  return { businesses, loading };
}
