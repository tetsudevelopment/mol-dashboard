import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Pagination, type PaginationProps } from "./pagination";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty = "Sin resultados",
  loading = false,
  testId,
  pagination,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty?: string;
  loading?: boolean;
  testId?: string;
  /** Omit for a list short enough that paging it would only get in the way. */
  pagination?: Omit<PaginationProps, "testId">;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="overflow-x-auto">
        <table
          data-testid={testId}
          className="w-full border-collapse text-left text-sm"
        >
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={cn("px-4 py-2 font-medium", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-xs text-zinc-500"
                >
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  data-testid={testId ? `${testId}-empty` : undefined}
                  className="px-4 py-6 text-center text-xs text-zinc-500"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  data-testid={testId ? `${testId}-row` : undefined}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-950"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-2 align-top", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <Pagination
          {...pagination}
          testId={testId ? `${testId}-pagination` : undefined}
        />
      ) : null}
    </div>
  );
}
