/**
 * useListings.ts
 * Manages browse listing queries with filter, sort, pagination.
 * All filtering is routed through getAllBusinesses with a full BusinessFilterInput
 * so that any combination of city + district + price + revenue + profit + category works.
 */
import { useState, useCallback, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  GET_ALL_BUSINESSES,
  GET_BUSINESS_BY_CATEGORY,
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

  const [loadAll,        { data: allData,  loading: allLoading  }] = useLazyQuery(GET_ALL_BUSINESSES,       { fetchPolicy: 'cache-and-network' });
  const [loadByCategory, { data: catData,  loading: catLoading  }] = useLazyQuery(GET_BUSINESS_BY_CATEGORY, { fetchPolicy: 'cache-and-network' });

  const buildSort = useCallback(() => {
    if (sortOrder === 'Low to High') return { price: 'ASC' };
    if (sortOrder === 'High to Low') return { price: 'DESC' };
    return null;
  }, [sortOrder]);

  const buildFilter = useCallback(() => {
    const f: Record<string, unknown> = {};

    if (filters.city)     f.city     = filters.city;
    if (filters.district) f.district = filters.district;

    if (filters.minPrice != null || filters.maxPrice != null)
      f.priceRange = [filters.minPrice ?? null, filters.maxPrice ?? null];

    if (filters.minRevenue != null || filters.maxRevenue != null)
      f.revenueRange = [filters.minRevenue ?? null, filters.maxRevenue ?? null];

    if (filters.minProfit != null || filters.maxProfit != null)
      f.profitRange = [filters.minProfit ?? null, filters.maxProfit ?? null];

    return Object.keys(f).length > 0 ? f : null;
  }, [filters]);

  useEffect(() => {
    const sort   = buildSort();
    const filter = buildFilter();
    const offset = (currentPage - 1) * PAGE_SIZE;

    if (selectedCategoryName) {
      loadByCategory({ variables: { category: selectedCategoryName, limit: PAGE_SIZE, offSet: offset, sort, filter } });
    } else {
      loadAll({ variables: { limit: PAGE_SIZE, offSet: offset, filter, sort } });
    }
  }, [currentPage, selectedCategoryName, sortOrder, filters, loadAll, loadByCategory, buildSort, buildFilter]);

  const businesses: BusinessListItem[] =
    allData?.getAllBusinesses?.businesses ||
    catData?.getAllBusinessesByCategory?.businesses || [];

  const totalCount: number =
    allData?.getAllBusinesses?.totalCount ||
    catData?.getAllBusinessesByCategory?.totalCount || 0;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const loading = allLoading || catLoading;

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
