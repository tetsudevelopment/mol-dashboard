"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, Select } from "@/components/ui/input";
import { usePayments } from "@/queries/admin-payments.queries";
import { usePagination } from "@/lib/pagination";
import type { Payment, PaymentStatus } from "@/validators/payment.schema";

const STATUS_VARIANT = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  refunded: "info",
  error: "error",
} as const;

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const { page, pageSize, setPage, setPageSize } = usePagination(statusFilter);
  const paymentsQuery = usePayments({
    ...(statusFilter !== "" ? { status: statusFilter } : {}),
    page,
    pageSize,
  });

  const columns: Column<Payment>[] = [
    {
      key: "id",
      header: "ID",
      render: (p) => (
        <span className="font-mono text-[10px] text-zinc-500" title={p.id}>
          {p.id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "concept",
      header: "Concepto",
      render: (p) => <span className="text-xs">{p.concept}</span>,
    },
    {
      key: "amount",
      header: "Monto",
      render: (p) => (
        <span className="font-mono text-xs font-medium">
          {p.amount} {p.currency}
        </span>
      ),
    },
    {
      key: "gateway",
      header: "Gateway",
      render: (p) => <span className="text-xs">{p.gateway}</span>,
    },
    {
      key: "transaction",
      header: "Transacción",
      render: (p) => (
        <span className="font-mono text-[10px] text-zinc-500" title={p.transaction_id}>
          {p.transaction_id.slice(0, 16)}…
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge variant={STATUS_VARIANT[p.status]}>{p.status}</StatusBadge>,
    },
    {
      key: "date",
      header: "Fecha",
      render: (p) => (
        <span className="text-xs text-zinc-500">
          {new Date(p.attempted_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Lectura cross-user de pagos. Estado, gateway y trazabilidad por transacción."
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Field label="Status" htmlFor="filter-status">
          <Select
            id="filter-status"
            data-testid="payments-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "")}
          >
            <option value="">Todos</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="refunded">refunded</option>
            <option value="error">error</option>
          </Select>
        </Field>
      </section>

      <ErrorBanner error={paymentsQuery.error} testId="payments-list-error" />

      <DataTable
        rows={paymentsQuery.data?.payments ?? []}
        columns={columns}
        rowKey={(p) => p.id}
        loading={paymentsQuery.isPending}
        empty="No hay pagos todavía."
        testId="payments-table"
        pagination={{
          page,
          pageSize,
          total: paymentsQuery.data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </>
  );
}
