/**
 * useBusinessDetail.ts
 * Fetches single business + auto-calls viewBusiness on load.
 * Mirrors OLD frontend SingleViewlisting.jsx exactly.
 */
import { useEffect, useRef } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_BUSINESS } from '../graphql/queries/business';
import { SAVE_BUSINESS, VIEW_BUSINESS } from '../graphql/mutations/business';
import type { BusinessDetail } from '../types/api';

export function useBusinessDetail(businessId: string | number | null | undefined) {
  const viewTrackedRef = useRef<string | null>(null);

  const [loadBusiness, { data, loading, error, refetch }] = useLazyQuery(GET_BUSINESS, { fetchPolicy: 'network-only' });
  const [viewBusiness] = useMutation(VIEW_BUSINESS, { errorPolicy: 'all' });
  const [saveBusinessMutation] = useMutation(SAVE_BUSINESS, { errorPolicy: 'all' });

  useEffect(() => {
    if (businessId) {
      loadBusiness({ variables: { getBusinessByIdId: String(businessId) } });
    }
  }, [businessId, loadBusiness]);

  const businessData: BusinessDetail | null = data?.getBusinessById?.business ?? null;

  // Auto-track view once — mirrors OLD frontend SingleViewlisting.jsx
  useEffect(() => {
    if (businessData?.id && viewTrackedRef.current !== businessData.id) {
      viewTrackedRef.current = businessData.id;
      viewBusiness({ variables: { viewBusinessId: businessData.id } })
        .catch(err => console.error('Error tracking view:', err));
    }
  }, [businessData?.id, viewBusiness]);

  const toggleSave = async () => {
    if (!businessData?.id) return;
    await saveBusinessMutation({ variables: { saveBusinessId: businessData.id } });
    refetch();
  };

  return {
    business: businessData,
    numberOfFavorites: data?.getBusinessById?.numberOfFavorites ?? 0,
    numberOfOffers: data?.getBusinessById?.numberOfOffers ?? 0,
    totalViews: data?.getBusinessById?.totalViews ?? 0,
    loading,
    error,
    toggleSave,
  };
}
