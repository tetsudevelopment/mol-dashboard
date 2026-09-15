"use client";

import { useState } from "react";
import { Shield, Trash2 } from "lucide-react";

import { ApiClientError } from "@/api/types";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { Field, Select, TextInput } from "@/components/ui/input";
import {
  useDeleteUser,
  useUpdateUserRole,
  useUsers,
} from "@/queries/admin-users.queries";
import { usePagination } from "@/lib/pagination";
import { useAuthStore } from "@/stores/auth.store";
import type { AdminUser, UserRole } from "@/validators/user.schema";

const ROLE_VARIANT = {
  user: "neutral",
  admin: "info",
  superadmin: "success",
} as const;

// The backend returns delete-user errors with an English message. Map the
// known error codes to Spanish for the admin UI; fall back to the raw message.
const DELETE_USER_ERROR_MESSAGES: Record<string, string> = {
  USER_HAS_FINANCIAL_RECORDS:
    "No se puede eliminar este usuario porque tiene pagos o alquileres registrados.",
  CANNOT_DELETE_SELF: "No podés eliminar tu propia cuenta.",
};

function deleteUserErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiClientError) {
    return DELETE_USER_ERROR_MESSAGES[error.code] ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [search, setSearch] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePagination(`${roleFilter}|${search}`);
  const usersQuery = useUsers({
    ...(roleFilter !== "" ? { role: roleFilter } : {}),
    ...(search.length > 0 ? { search } : {}),
    page,
    pageSize,
  });

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("user");
  const updateMutation = useUpdateUserRole();

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const deleteMutation = useDeleteUser();

  function openRoleModal(user: AdminUser) {
    setRoleTarget(user);
    setNewRole(user.role);
  }

  function openDeleteDialog(user: AdminUser) {
    deleteMutation.reset();
    setDeleteTarget(user);
  }

  function handleDeleteCancel() {
    if (deleteMutation.isPending) return;
    deleteMutation.reset();
    setDeleteTarget(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      /* error surfaced via deleteMutation.error in the dialog */
    }
  }

  async function handleRoleSubmit() {
    if (!roleTarget) return;
    await updateMutation.mutateAsync({ id: roleTarget.id, input: { role: newRole } });
    setRoleTarget(null);
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      header: "Usuario",
      render: (u) => (
        <div>
          <div className="font-medium">
            {u.first_name} {u.last_name}
          </div>
          <div className="text-xs text-zinc-500">{u.email ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      render: (u) => <StatusBadge variant={ROLE_VARIANT[u.role]}>{u.role}</StatusBadge>,
    },
    {
      key: "status",
      header: "Estado",
      render: (u) => (
        <StatusBadge
          variant={
            u.status === "active"
              ? "success"
              : u.status === "pending_verification"
                ? "warning"
                : "neutral"
          }
        >
          {u.status}
        </StatusBadge>
      ),
    },
    {
      key: "verified",
      header: "Email verificado",
      render: (u) => (
        <span className="text-xs">{u.email_verified ? "✓" : "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (u) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openRoleModal(u)}
            disabled={u.id === currentUser?.id}
            title={u.id === currentUser?.id ? "No podés cambiar tu propio rol" : "Cambiar rol"}
            data-testid={`user-role-btn-${u.id}`}
          >
            <Shield className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openDeleteDialog(u)}
            disabled={u.id === currentUser?.id}
            title={
              u.id === currentUser?.id
                ? "No podés eliminar tu propia cuenta"
                : "Eliminar usuario"
            }
            data-testid={`user-delete-btn-${u.id}`}
          >
            <Trash2 className="size-3.5 text-red-600 dark:text-red-400" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Listado de usuarios y promoción de admin. Esto reemplaza el UPDATE SQL manual."
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Field label="Rol" htmlFor="filter-role">
          <Select
            id="filter-role"
            data-testid="user-filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
          >
            <option value="">Todos</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </Select>
        </Field>
        <Field label="Buscar" htmlFor="filter-search" hint="Email, nombre o apellido">
          <TextInput
            id="filter-search"
            data-testid="user-filter-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ej. juan@..."
          />
        </Field>
      </section>

      <ErrorBanner error={usersQuery.error} testId="users-list-error" />

      <DataTable
        rows={usersQuery.data?.users ?? []}
        columns={columns}
        rowKey={(u) => u.id}
        loading={usersQuery.isPending}
        empty="No hay usuarios que coincidan."
        testId="users-table"
        pagination={{
          page,
          pageSize,
          total: usersQuery.data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      <Modal
        open={roleTarget !== null}
        onClose={() => {
          updateMutation.reset();
          setRoleTarget(null);
        }}
        title={`Cambiar rol de ${roleTarget?.first_name ?? ""} ${roleTarget?.last_name ?? ""}`}
        width="sm"
      >
        {roleTarget ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              Rol actual:{" "}
              <span className="font-medium">{roleTarget.role}</span>
            </p>
            <Field label="Nuevo rol" htmlFor="new-role">
              <Select
                id="new-role"
                data-testid="user-new-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </Select>
            </Field>
            <ErrorBanner error={updateMutation.error} testId="user-role-error" />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setRoleTarget(null)}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleRoleSubmit}
                disabled={updateMutation.isPending}
                data-testid="user-role-confirm"
              >
                {updateMutation.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Eliminar usuario"
        description={
          deleteTarget
            ? `¿Eliminar a ${deleteTarget.first_name} ${deleteTarget.last_name} (${deleteTarget.email ?? "sin email"})? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        confirmVariant="danger"
        pending={deleteMutation.isPending}
        error={deleteUserErrorMessage(deleteMutation.error)}
      />
    </>
  );
}
