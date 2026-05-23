"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { Field, Select, TextInput } from "@/components/ui/input";
import { useUsers, useUpdateUserRole } from "@/queries/admin-users.queries";
import { useAuthStore } from "@/stores/auth.store";
import type { AdminUser, UserRole } from "@/validators/user.schema";

const ROLE_VARIANT = {
  user: "neutral",
  admin: "info",
  superadmin: "success",
} as const;

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [search, setSearch] = useState("");
  const usersQuery = useUsers({
    ...(roleFilter !== "" ? { role: roleFilter } : {}),
    ...(search.length > 0 ? { search } : {}),
  });

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("user");
  const updateMutation = useUpdateUserRole();

  function openRoleModal(user: AdminUser) {
    setRoleTarget(user);
    setNewRole(user.role);
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
    </>
  );
}
