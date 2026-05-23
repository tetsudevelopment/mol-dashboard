"use client";

import { RefreshCcw } from "lucide-react";
import { ApiClientError } from "@/api/types";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useHealthLive, useHealthReady } from "@/queries/health.queries";
import { env } from "@/lib/env";
import type {
  LiveResult,
  ReadyResult,
} from "@/api/endpoints/health";

export default function HealthPage() {
  const live = useHealthLive();
  const ready = useHealthReady();

  return (
    <>
      <PageHeader
        title="Health"
        description={`Polling ${env.NEXT_PUBLIC_API_URL} every 15 seconds.`}
        actions={
          <button
            type="button"
            onClick={() => {
              live.refetch();
              ready.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <RefreshCcw className="size-3.5" aria-hidden />
            Refresh
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ProbeCard
          title="Live"
          path="/api/v1/health/live"
          okStatus="ok"
          data={live.data}
          error={live.error}
          isPending={live.isPending}
          isFetching={live.isFetching}
          dataUpdatedAt={live.dataUpdatedAt}
        />
        <ProbeCard
          title="Ready"
          path="/api/v1/health/ready"
          okStatus="ready"
          data={ready.data}
          error={ready.error}
          isPending={ready.isPending}
          isFetching={ready.isFetching}
          dataUpdatedAt={ready.dataUpdatedAt}
        />
      </div>
    </>
  );
}

function ProbeCard({
  title,
  path,
  okStatus,
  data,
  error,
  isPending,
  isFetching,
  dataUpdatedAt,
}: {
  title: string;
  path: string;
  okStatus: string;
  data: LiveResult | ReadyResult | undefined;
  error: unknown;
  isPending: boolean;
  isFetching: boolean;
  dataUpdatedAt: number;
}) {
  return (
    <article
      data-testid={`probe-${title.toLowerCase()}`}
      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium">{title}</h3>
          <code className="text-xs text-zinc-500">{path}</code>
        </div>
        <StatusIndicator
          data={data}
          error={error}
          isPending={isPending}
          okStatus={okStatus}
        />
      </header>

      <div className="space-y-3 text-xs">
        <Row label="Last updated">
          {dataUpdatedAt
            ? new Date(dataUpdatedAt).toLocaleTimeString()
            : "—"}
          {isFetching ? (
            <span className="ml-2 text-zinc-500">(fetching…)</span>
          ) : null}
        </Row>
        {error instanceof ApiClientError ? (
          <Row label="Error">
            <span className="text-red-600 dark:text-red-400">
              [{error.code}] {error.message}
            </span>
          </Row>
        ) : error ? (
          <Row label="Error">
            <span className="text-red-600 dark:text-red-400">
              {String((error as Error).message ?? error)}
            </span>
          </Row>
        ) : null}
      </div>

      <pre className="mt-4 max-h-72 overflow-auto rounded bg-zinc-100 p-3 text-[11px] leading-relaxed dark:bg-zinc-900">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </article>
  );
}

function StatusIndicator({
  data,
  error,
  isPending,
  okStatus,
}: {
  data: { status: string } | undefined;
  error: unknown;
  isPending: boolean;
  okStatus: string;
}) {
  if (isPending) return <StatusBadge variant="neutral">loading</StatusBadge>;
  if (error) return <StatusBadge variant="error">down</StatusBadge>;
  if (data?.status === okStatus)
    return <StatusBadge variant="success">{data.status}</StatusBadge>;
  return <StatusBadge variant="warning">{data?.status ?? "unknown"}</StatusBadge>;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-28 shrink-0 text-zinc-500">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
