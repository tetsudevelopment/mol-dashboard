"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, Select, TextInput } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CouponForm } from "@/components/coupons/coupon-form";
import {
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from "@/queries/admin-coupons.queries";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/datetime";
import { usePagination } from "@/lib/pagination";
import type { Coupon, CreateCouponInput } from "@/validators/coupon.schema";

type StatusFilter = Coupon["status"] | "";

export default function CouponsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");

  const { page, pageSize, setPage, setPageSize } = usePagination(
    `${statusFilter}|${search}`,
  );
  const couponsQuery = useCoupons({
    ...(statusFilter !== "" ? { status: statusFilter } : {}),
    ...(search !== "" ? { search } : {}),
    page,
    pageSize,
  });
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const coupons = couponsQuery.data?.coupons ?? [];

  /** The form hands back naive datetime-local strings; the API wants instants. */
  function toApiDates(values: CreateCouponInput) {
    return {
      start_date: fromDatetimeLocalValue(values.start_date),
      end_date: fromDatetimeLocalValue(values.end_date),
    };
  }

  async function handleCreate(values: CreateCouponInput) {
    await createMutation.mutateAsync({ ...values, ...toApiDates(values) });
    setCreateOpen(false);
  }

  async function handleUpdate(values: CreateCouponInput) {
    if (!editTarget) return;
    // `code` is deliberately absent: the backend's PATCH does not accept it,
    // because an existing code may already be printed or shared.
    await updateMutation.mutateAsync({
      id: editTarget.id,
      input: {
        description: values.description,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        max_uses: values.max_uses,
        status: values.status,
        ...toApiDates(values),
      },
    });
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Código",
      render: (c) => (
        <div>
          <span className="font-mono font-medium">{c.code}</span>
          {c.description ? (
            <p className="text-xs text-neutral-500">{c.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "discount",
      header: "Descuento",
      render: (c) => (
        <span className="font-mono text-xs">
          {c.discount_type === "percentage"
            ? `${c.discount_value} %`
            : `$ ${c.discount_value}`}
        </span>
      ),
    },
    {
      key: "window",
      header: "Vigencia",
      render: (c) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {formatDateTime(c.start_date)} → {formatDateTime(c.end_date)}
        </span>
      ),
    },
    {
      key: "uses",
      header: "Usos",
      render: (c) => (
        <span className="font-mono text-xs">
          {c.current_uses}
          {c.max_uses === null ? " / ∞" : ` / ${String(c.max_uses)}`}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (c) => (
        <StatusBadge
          variant={
            c.status === "active" ? "success" : c.status === "disabled" ? "neutral" : "warning"
          }
        >
          {c.status === "active"
            ? "Activo"
            : c.status === "disabled"
              ? "Deshabilitado"
              : "Expirado"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditTarget(c)}
            data-testid={`coupon-edit-btn-${c.id}`}
            aria-label={`Editar ${c.code}`}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteTarget(c)}
            data-testid={`coupon-delete-btn-${c.id}`}
            aria-label={`Borrar ${c.code}`}
          >
            <Trash2 className="size-3.5 text-red-600" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Códigos de descuento"
        description="Cupones que el usuario escribe en la app y se aplican sobre la tarifa del alquiler. El descuento se calcula en el backend y se cobra ya descontado — el límite de usos se respeta de forma atómica."
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            data-testid="coupon-create-btn"
          >
            <Plus className="size-4" aria-hidden />
            Crear código
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Buscar código" htmlFor="coupon-search">
          <TextInput
            id="coupon-search"
            data-testid="coupon-search"
            placeholder="VERANO"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label="Estado" htmlFor="coupon-status-filter">
          <Select
            id="coupon-status-filter"
            data-testid="coupon-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="disabled">Deshabilitados</option>
            <option value="expired">Expirados</option>
          </Select>
        </Field>
      </div>

      <ErrorBanner error={couponsQuery.error} testId="coupons-list-error" />

      <DataTable
        rows={coupons}
        columns={columns}
        rowKey={(c) => c.id}
        loading={couponsQuery.isPending}
        empty="No hay códigos de descuento todavía. Creá el primero."
        testId="coupons-table"
        pagination={{
          page,
          pageSize,
          total: couponsQuery.data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear código de descuento"
        width="lg"
      >
        <CouponForm
          submitLabel="Crear"
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          pending={createMutation.isPending}
          error={createMutation.error}
        />
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`Editar ${editTarget?.code ?? ""}`}
        width="lg"
      >
        {editTarget ? (
          <CouponForm
            submitLabel="Guardar"
            codeLocked
            defaultValues={{
              code: editTarget.code,
              description: editTarget.description,
              discount_type: editTarget.discount_type,
              discount_value: editTarget.discount_value,
              start_date: toDatetimeLocalValue(editTarget.start_date),
              end_date: toDatetimeLocalValue(editTarget.end_date),
              max_uses: editTarget.max_uses,
              status: editTarget.status,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            pending={updateMutation.isPending}
            error={updateMutation.error}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Borrar código "${deleteTarget?.code ?? ""}"`}
        description="Si el código ya fue canjeado en algún alquiler, el backend lo rechaza para no romper el historial — en ese caso editalo y ponelo como Deshabilitado."
        confirmLabel="Borrar"
        confirmVariant="danger"
        pending={deleteMutation.isPending}
        error={deleteMutation.error instanceof Error ? deleteMutation.error.message : null}
        onCancel={() => {
          deleteMutation.reset();
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
