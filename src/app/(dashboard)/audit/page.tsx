"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, TextInput } from "@/components/ui/input";
import { useAuditLog } from "@/queries/admin-audit.queries";
import type { AuditLog } from "@/validators/audit.schema";

export default function AuditPage() {
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const auditQuery = useAuditLog({
    ...(action.length > 0 ? { action } : {}),
    ...(actor.length > 0 ? { actor } : {}),
  });

  const columns: Column<AuditLog>[] = [
    {
      key: "when",
      header: "Cuándo",
      render: (a) => (
        <span className="text-xs">{new Date(a.created_at).toLocaleString()}</span>
      ),
    },
    {
      key: "action",
      header: "Acción",
      render: (a) => <span className="font-mono text-xs font-medium">{a.action}</span>,
    },
    {
      key: "actor",
      header: "Actor",
      render: (a) => (
        <span className="font-mono text-[10px] text-zinc-500" title={a.actor}>
          {a.actor.length > 16 ? `${a.actor.slice(0, 8)}…` : a.actor}
        </span>
      ),
    },
    {
      key: "ip",
      header: "IP",
      render: (a) => <span className="font-mono text-xs">{a.ip ?? "—"}</span>,
    },
    {
      key: "metadata",
      header: "Metadata",
      render: (a) =>
        a.metadata ? (
          <pre className="max-h-20 overflow-auto rounded bg-zinc-100 p-1.5 text-[10px] leading-tight dark:bg-zinc-900">
            {JSON.stringify(a.metadata, null, 0)}
          </pre>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Append-only. Toda acción crítica (auth, payments, rentals, admin CRUD) queda registrada acá."
      />

      <section className="mb-4 grid grid-cols-2 gap-3">
        <Field label="Action" htmlFor="filter-action" hint="ej. payment.charged">
          <TextInput
            id="filter-action"
            data-testid="audit-filter-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </Field>
        <Field label="Actor" htmlFor="filter-actor" hint="userId UUID o 'system'">
          <TextInput
            id="filter-actor"
            data-testid="audit-filter-actor"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </Field>
      </section>

      <ErrorBanner error={auditQuery.error} testId="audit-list-error" />

      <DataTable
        rows={auditQuery.data?.entries ?? []}
        columns={columns}
        rowKey={(a) => a.id}
        loading={auditQuery.isPending}
        empty="Sin entradas que coincidan."
        testId="audit-table"
      />
    </>
  );
}
