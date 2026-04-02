/**
 * useListings.ts
 * Manages browse listing queries with filter, sort, pagination.
 * P13: routes to dedicated filter queries for city/district/profit/revenue.
 */
import { useState, useCallback, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  GET_ALL_BUSINESSES,
  GET_BUSINESS_BY_CATEGORY,
  GET_BUSINESSES_BY_CITY,
  GET_BUSINESSES_BY_DISTRICT,
  GET_BUSINESSES_BY_PROFIT,
  GET_BUSINESSES_BY_REVENUE,
} from '../graphql/queries/business';
import type { BusinessListItem } from '../types/api';

export type SortOption = 'default' | 'Low to High' | 'High to Low';

export interface ListingFilters {
  city: string | null;
  district: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRevenue: number | null;
  maxRevenue: number | null;
  minProfit: number | null;
  maxProfit: number | null;
}

const DEFAULT_FILTERS: ListingFilters = {
  city: null, district: null,
  minPrice: null, maxPrice: null,
  minRevenue: null, maxRevenue: null,
  minProfit: null, maxProfit: null,
};
const PAGE_SIZE = 12;

export function useListings() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOption>('default');
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS);

  // Base queries
  const [loadAll,        { data: allData,      loading: allLoading      }] = useLazyQuery(GET_ALL_BUSINESSES,       { fetchPolicy: 'cache-and-network' });
  const [loadByCategory, { data: catData,      loading: catLoading      }] = useLazyQuery(GET_BUSINESS_BY_CATEGORY, { fetchPolicy: 'cache-and-network' });
  // P13: dedicated filter queries
  const [loadByCity,     { data: cityData,     loading: cityLoading     }] = useLazyQuery(GET_BUSINESSES_BY_CITY,     { fetchPolicy: 'cache-and-network' });
  const [loadByDistrict, { data: distData,     loading: distLoading     }] = useLazyQuery(GET_BUSINESSES_BY_DISTRICT, { fetchPolicy: 'cache-and-network' });
  const [loadByProfit,   { data: profitData,   loading: profitLoading   }] = useLazyQuery(GET_BUSINESSES_BY_PROFIT,   { fetchPolicy: 'cache-and-network' });
  const [loadByRevenue,  { data: revenueData,  loading: revenueLoading  }] = useLazyQuery(GET_BUSINESSES_BY_REVENUE,  { fetchPolicy: 'cache-and-network' });

  const buildSort = useCallback(() => {
    if (sortOrder === 'Low to High') return { price: 'ASC' };
    if (sortOrder === 'High to Low') return { price: 'DESC' };
    return null;
  }, [sortOrder]);

  const buildFilter = useCallback(() => {
    const f: Record<string, unknown> = {};
    if (filters.minPrice != null || filters.maxPrice != null)
      f.priceRange = [filters.minPrice ?? null, filters.maxPrice ?? null];
    return Object.keys(f).length > 0 ? f : null;
  }, [filters]);

  useEffect(() => {
    const sort = buildSort();
    const filter = buildFilter();
    const offset = (currentPage - 1) * PAGE_SIZE;

    // P13: route to the correct dedicated query based on active filter
    if (filters.city) {
      loadByCity({ variables: { city: filters.city, limit: PAGE_SIZE, offSet: offset, sort } });
    } else if (filters.district) {
      loadByDistrict({ variables: { district: filters.district, limit: PAGE_SIZE, offSet: offset, sort } });
    } else if (filters.minProfit != null || filters.maxProfit != null) {
      loadByProfit({ variables: { profit: [filters.minProfit ?? 0, filters.maxProfit ?? 999999999], limit: PAGE_SIZE, offSet: offset, sort } });
    } else if (filters.minRevenue != null || filters.maxRevenue != null) {
      loadByRevenue({ variables: { revenue: [filters.minRevenue ?? 0, filters.maxRevenue ?? 999999999], limit: PAGE_SIZE, offSet: offset, sort } });
    } else if (selectedCategoryName) {
      loadByCategory({ variables: { category: selectedCategoryName, limit: PAGE_SIZE, offSet: offset, sort, filter } });
    } else {
      loadAll({ variables: { limit: PAGE_SIZE, offSet: offset, filter, sort } });
    }
  }, [currentPage, selectedCategoryName, sortOrder, filters, loadAll, loadByCategory, loadByCity, loadByDistrict, loadByProfit, loadByRevenue, buildSort, buildFilter]);

  const businesses: BusinessListItem[] =
    cityData?.getAllBusinessesByCity?.businesses ||
    distData?.getAllBusinessesByDistrict?.businesses ||
    profitData?.getAllBusinessesByProfit?.businesses ||
    revenueData?.getAllBusinessesByRevenue?.businesses ||
    allData?.getAllBusinesses?.businesses ||
    catData?.getAllBusinessesByCategory?.businesses || [];

  const totalCount: number =
    cityData?.getAllBusinessesByCity?.totalCount ||
    distData?.getAllBusinessesByDistrict?.totalCount ||
    profitData?.getAllBusinessesByProfit?.totalCount ||
    revenueData?.getAllBusinessesByRevenue?.totalCount ||
    allData?.getAllBusinesses?.totalCount ||
    catData?.getAllBusinessesByCategory?.totalCount || 0;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const loading = allLoading || catLoading || cityLoading || distLoading || profitLoading || revenueLoading;

  const selectCategory = useCallback((id: string | null, name: string | null) => {
    setSelectedCategoryId(id);
    setSelectedCategoryName(name);
    setCurrentPage(1);
  }, []);

  const applyFilters = useCallback((newFilters: Partial<ListingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSelectedCategoryId(null);
    setSelectedCategoryName(null);
    setSortOrder('default');
    setCurrentPage(1);
  }, []);

  const changeSortOrder = useCallback((order: SortOption) => {
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    businesses, loading, totalCount, totalPages, currentPage,
    selectedCategoryId, selectedCategoryName, sortOrder, filters,
    selectCategory, applyFilters, resetFilters, changeSortOrder, goToPage,
  };
}
