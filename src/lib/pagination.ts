"use client";

import { useState } from "react";

export const DEFAULT_PAGE_SIZE = 20;

/**
 * Capped at 100 because that is the `page_size` ceiling every admin list
 * endpoint enforces (`z.coerce.number().int().min(1).max(100)`); offering a
 * larger option would just produce a 422 from the backend.
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export function pageCount(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 1;
  return Math.ceil(total / pageSize);
}

/**
 * Client-side slice, for the few lists whose endpoint has no pagination and
 * returns every row at once (stations, advertisers, campaigns).
 */
export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export interface PaginationState {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

/**
 * Page/pageSize state for a table.
 *
 * `filterKey` is a serialized snapshot of whatever filters feed the list. When
 * it changes the page snaps back to 1 — otherwise narrowing a filter while on
 * page 5 leaves the operator staring at an empty table and assuming the data
 * is gone. The reset happens during render rather than in an effect, so that
 * stale page is never rendered at all.
 */
export function usePagination(filterKey = ""): PaginationState {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(DEFAULT_PAGE_SIZE);
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);

  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  function setPageSize(next: number) {
    setPageSizeState(next);
    setPage(1);
  }

  return { page, pageSize, setPage, setPageSize };
}
