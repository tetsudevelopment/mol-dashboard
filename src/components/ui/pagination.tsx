"use client";

import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { PAGE_SIZE_OPTIONS, pageCount } from "@/lib/pagination";

export interface PaginationProps {
  page: number;
  pageSize: number;
  /** Total rows across every page, as reported by the backend. */
  total: number;
  onPageChange: (page: number) => void;
  /** Omit to hide the rows-per-page selector. */
  onPageSizeChange?: (pageSize: number) => void;
  testId?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  testId,
}: PaginationProps) {
  const lastPage = pageCount(total, pageSize);
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <div
      data-testid={testId}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center gap-2">
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5 text-zinc-500">
            <span>Filas</span>
            <select
              data-testid={testId ? `${testId}-size` : undefined}
              aria-label="Filas por página"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <span data-testid={testId ? `${testId}-range` : undefined} className="text-zinc-500">
          {total === 0 ? "Sin resultados" : `${firstRow}–${lastRow} de ${total}`}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <PageButton
          label="Primera página"
          icon={ChevronFirst}
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          testId={testId ? `${testId}-first` : undefined}
        />
        <PageButton
          label="Página anterior"
          icon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          testId={testId ? `${testId}-prev` : undefined}
        />
        <span
          data-testid={testId ? `${testId}-current` : undefined}
          className="px-2 font-medium tabular-nums"
        >
          {page} / {lastPage}
        </span>
        <PageButton
          label="Página siguiente"
          icon={ChevronRight}
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
          testId={testId ? `${testId}-next` : undefined}
        />
        <PageButton
          label="Última página"
          icon={ChevronLast}
          disabled={page >= lastPage}
          onClick={() => onPageChange(lastPage)}
          testId={testId ? `${testId}-last` : undefined}
        />
      </div>
    </div>
  );
}

function PageButton({
  label,
  icon: Icon,
  disabled,
  onClick,
  testId,
}: {
  label: string;
  icon: typeof ChevronLeft;
  disabled: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "rounded-md border border-zinc-300 p-1 transition-colors dark:border-zinc-700",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-900",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}
