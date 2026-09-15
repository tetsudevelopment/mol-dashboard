"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, Select } from "@/components/ui/input";
import { useRentals } from "@/queries/admin-rentals.queries";
import { usePagination } from "@/lib/pagination";
import type { Rental, RentalStatus } from "@/validators/rental.schema";

const STATUS_VARIANT = {
  active: "info",
  completed: "success",
  cancelled: "neutral",
  penalized: "warning",
} as const;

export default function RentalsPage() {
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "">("");
  const { page, pageSize, setPage, setPageSize } = usePagination(statusFilter);
  const rentalsQuery = useRentals({
    ...(statusFilter !== "" ? { status: statusFilter } : {}),
    page,
    pageSize,
  });

  const columns: Column<Rental>[] = [
    {
      key: "id",
      header: "ID",
      render: (r) => (
        <span className="font-mono text-[10px] text-zinc-500" title={r.id}>
          {r.id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "start",
      header: "Inicio",
      render: (r) => (
        <span className="text-xs">{new Date(r.start_time).toLocaleString()}</span>
      ),
    },
    {
      key: "end",
      header: "Fin",
      render: (r) => (
        <span className="text-xs text-zinc-500">
          {r.end_time ? new Date(r.end_time).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duración",
      render: (r) => (
        <span className="text-xs">
          {r.actual_duration_hours ?? r.estimated_duration_hours}h
        </span>
      ),
    },
    {
      key: "cost",
      header: "Costo",
      render: (r) => (
        <span className="font-mono text-xs">
          {r.final_cost ?? r.estimated_cost} {r.currency}
        </span>
      ),
    },
    {
      key: "penalty",
      header: "Penalty",
      render: (r) =>
        Number(r.penalty) > 0 ? (
          <span className="font-mono text-xs text-amber-600">
            +{r.penalty} {r.currency}
          </span>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge variant={STATUS_VARIANT[r.status]}>{r.status}</StatusBadge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Rentals"
        description="Lectura cross-user de alquileres. Filtros por status."
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Field label="Status" htmlFor="filter-status">
          <Select
            id="filter-status"
            data-testid="rentals-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RentalStatus | "")}
          >
            <option value="">Todos</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="penalized">penalized</option>
          </Select>
        </Field>
      </section>

      <ErrorBanner error={rentalsQuery.error} testId="rentals-list-error" />

      <DataTable
        rows={rentalsQuery.data?.rentals ?? []}
        columns={columns}
        rowKey={(r) => r.id}
        loading={rentalsQuery.isPending}
        empty="No hay alquileres todavía."
        testId="rentals-table"
        pagination={{
          page,
          pageSize,
          total: rentalsQuery.data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </>
  );
}
