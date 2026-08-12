"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, Select, TextInput } from "@/components/ui/input";
import { usePolicyAcceptances } from "@/queries/admin-policy-acceptances.queries";
import { formatDateTime } from "@/lib/datetime";
import {
  POLICY_TYPES,
  policyTypeLabel,
  type PolicyAcceptance,
} from "@/validators/policy-acceptance.schema";

export default function PolicyAcceptancesPage() {
  const [policyType, setPolicyType] = useState("");
  const [version, setVersion] = useState("");

  const query = usePolicyAcceptances({
    ...(policyType !== "" ? { policyType } : {}),
    ...(version !== "" ? { version } : {}),
  });

  const acceptances = query.data?.acceptances ?? [];
  const currentVersions = query.data?.currentVersions ?? {};

  function isCurrent(row: PolicyAcceptance): boolean {
    return currentVersions[row.policy_type] === row.version;
  }

  const columns: Column<PolicyAcceptance>[] = [
    {
      key: "user",
      header: "Usuario",
      render: (a) => (
        <div>
          <span className="font-medium">{a.user_name}</span>
          {a.user_email ? (
            <p className="text-xs text-neutral-500">{a.user_email}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "policy",
      header: "Documento",
      render: (a) => <span className="text-sm">{policyTypeLabel(a.policy_type)}</span>,
    },
    {
      key: "version",
      header: "Versión",
      render: (a) => (
        <StatusBadge variant={isCurrent(a) ? "success" : "neutral"}>
          v{a.version}
          {isCurrent(a) ? " · vigente" : " · anterior"}
        </StatusBadge>
      ),
    },
    {
      key: "accepted_at",
      header: "Aceptado",
      render: (a) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {formatDateTime(a.accepted_at)}
        </span>
      ),
    },
    {
      key: "ip",
      header: "IP",
      render: (a) => <span className="font-mono text-xs">{a.ip ?? "—"}</span>,
    },
    {
      key: "user_agent",
      header: "Dispositivo",
      render: (a) => (
        <span
          className="block max-w-[16rem] truncate text-xs text-neutral-500"
          title={a.user_agent ?? undefined}
        >
          {a.user_agent ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Aceptaciones de políticas"
        description="Registro append-only de qué documento aceptó cada usuario, en qué versión, cuándo y desde dónde. Al cambiar el texto de un documento se sube su versión y se le vuelve a pedir a todos — las aceptaciones anteriores quedan como prueba de lo que aceptaron en su momento."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Documento" htmlFor="acceptance-policy-filter">
          <Select
            id="acceptance-policy-filter"
            data-testid="acceptance-policy-filter"
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value)}
          >
            <option value="">Todos</option>
            {POLICY_TYPES.map((type) => (
              <option key={type} value={type}>
                {policyTypeLabel(type)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Versión" htmlFor="acceptance-version-filter">
          <TextInput
            id="acceptance-version-filter"
            data-testid="acceptance-version-filter"
            placeholder="1"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </Field>
        {Object.keys(currentVersions).length > 0 ? (
          <p className="pb-2 text-xs text-neutral-500" data-testid="acceptance-current-versions">
            Versiones vigentes:{" "}
            {Object.entries(currentVersions)
              .map(([type, v]) => `${policyTypeLabel(type)} v${v}`)
              .join(" · ")}
          </p>
        ) : null}
      </div>

      <ErrorBanner error={query.error} testId="acceptances-list-error" />

      <DataTable
        rows={acceptances}
        columns={columns}
        rowKey={(a) => a.id}
        loading={query.isPending}
        empty="Todavía no hay aceptaciones registradas."
        testId="acceptances-table"
      />

      {query.data ? (
        <p className="mt-3 text-xs text-neutral-500" data-testid="acceptances-total">
          {query.data.total} registro{query.data.total === 1 ? "" : "s"}
        </p>
      ) : null}
    </>
  );
}
