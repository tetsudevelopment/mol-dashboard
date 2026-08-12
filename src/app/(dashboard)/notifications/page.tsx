"use client";

import { useState } from "react";
import { AlertTriangle, BellRing, Check, Send, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, TextInput } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useBroadcastNotification } from "@/queries/admin-notifications.queries";
import { useUsers } from "@/queries/admin-users.queries";
import {
  BroadcastInputSchema,
  type BroadcastResult,
  type BroadcastType,
} from "@/validators/notification.schema";

const TITLE_MAX = 150;
const BODY_MAX = 1000;

type Audience = "all" | "selected";

export default function NotificationsPage() {
  const usersQuery = useUsers({});
  const broadcast = useBroadcastNotification();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<BroadcastType>("promotion");
  const [audience, setAudience] = useState<Audience>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BroadcastResult | null>(null);

  const users = usersQuery.data?.users ?? [];
  // Only active users can receive a broadcast — the backend filters by status
  // anyway, so offering suspended accounts here would just be a lie.
  const selectableUsers = users.filter((u) => u.status === "active");

  function buildInput() {
    return {
      title,
      body,
      type,
      ...(audience === "selected" ? { user_ids: [...selectedIds] } : {}),
    };
  }

  // Errors are set on a failed submit; drop each one as soon as the operator
  // edits that field, so a corrected input stops showing a stale complaint.
  function clearFieldError(key: string) {
    setFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setResult(null);

    const parsed = BroadcastInputSchema.safeParse(buildInput());
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        errors[key] ??= issue.message;
      }
      // A "selected" audience with nobody checked fails Zod's .min(1) on
      // user_ids with a message that would read as gibberish to an operator.
      if (audience === "selected" && selectedIds.size === 0) {
        errors.user_ids = "Seleccioná al menos un usuario";
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    const parsed = BroadcastInputSchema.safeParse(buildInput());
    if (!parsed.success) return;

    const outcome = await broadcast.mutateAsync(parsed.data);
    setResult(outcome);
    setConfirmOpen(false);
    setTitle("");
    setBody("");
    setSelectedIds(new Set());
    setAudience("all");
  }

  function toggleUser(id: string) {
    clearFieldError("user_ids");
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const recipientCount =
    audience === "all" ? selectableUsers.length : selectedIds.size;

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        description="Enviá una notificación push y al buzón in-app de los usuarios."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Título" htmlFor="title" error={fieldErrors.title}>
            <TextInput
              id="title"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => {
                setTitle(e.target.value);
                clearFieldError("title");
              }}
              placeholder="Ej: Mantenimiento programado"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {title.length}/{TITLE_MAX}
            </p>
          </Field>

          <Field label="Mensaje" htmlFor="body" error={fieldErrors.body}>
            <textarea
              id="body"
              value={body}
              maxLength={BODY_MAX}
              rows={5}
              onChange={(e) => {
                setBody(e.target.value);
                clearFieldError("body");
              }}
              placeholder="Texto que verá el usuario en la notificación."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {body.length}/{BODY_MAX}
            </p>
          </Field>

          <Field label="Tipo" htmlFor="type">
            <Select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as BroadcastType)}
            >
              <option value="promotion">Promoción</option>
              <option value="system">Sistema</option>
            </Select>
            <p className="mt-1 text-xs text-zinc-500">
              Define el ícono en el buzón de la app. Los tipos de alquiler y pago
              los escribe el backend, no se pueden enviar desde acá.
            </p>
          </Field>

          <Field label="Destinatarios" htmlFor="audience" error={fieldErrors.user_ids}>
            <Select
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
            >
              <option value="all">Todos los usuarios activos</option>
              <option value="selected">Seleccionar usuarios</option>
            </Select>
          </Field>

          {audience === "selected" ? (
            <div className="max-h-72 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800">
              {usersQuery.isPending ? (
                <p className="p-4 text-sm text-zinc-500">Cargando usuarios…</p>
              ) : selectableUsers.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500">No hay usuarios activos.</p>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {selectableUsers.map((user) => (
                    <li key={user.id}>
                      <label className="flex cursor-pointer items-center gap-3 p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleUser(user.id)}
                        />
                        <span className="flex-1">
                          {user.first_name} {user.last_name}
                          <span className="ml-2 text-xs text-zinc-500">
                            {user.email ?? user.phone ?? user.id}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {broadcast.isError ? <ErrorBanner error={broadcast.error} /> : null}

          <Button type="submit" variant="primary" disabled={broadcast.isPending}>
            <Send className="mr-2 size-4" />
            {broadcast.isPending ? "Enviando…" : "Enviar notificación"}
          </Button>
        </form>

        <aside className="space-y-4">
          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4" />
              Alcance
            </h2>
            <p className="mt-2 text-2xl font-semibold">{recipientCount}</p>
            <p className="text-xs text-zinc-500">
              {audience === "all"
                ? "usuarios activos"
                : "usuarios seleccionados"}
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <BellRing className="size-4" />
              Vista previa
            </h2>
            <div className="mt-3 rounded-md bg-zinc-100 p-3 dark:bg-zinc-900">
              <p className="text-sm font-medium">
                {title.trim() === "" ? "Título de la notificación" : title}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {body.trim() === "" ? "Cuerpo del mensaje…" : body}
              </p>
            </div>
          </section>

          {result ? (
            <section
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              data-testid="broadcast-result"
            >
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <Check className="size-4" />
                Resultado
              </h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Destinatarios</dt>
                  <dd>{result.recipients}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Guardadas en el buzón</dt>
                  <dd>{result.notificationsCreated}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Push entregados</dt>
                  <dd>{result.pushSent}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Push fallidos</dt>
                  <dd>{result.pushFailed}</dd>
                </div>
              </dl>
              {!result.pushEnabled ? (
                <p className="mt-3 flex gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>
                    FCM no está configurado, así que no salió ningún push. Las
                    notificaciones sí quedaron guardadas y los usuarios las van a
                    ver al abrir la app.
                  </span>
                </p>
              ) : null}
            </section>
          ) : null}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirm()}
        title="Confirmar envío"
        description={
          audience === "all"
            ? `Esto le va a llegar a los ${selectableUsers.length} usuarios activos. No se puede deshacer ni editar después de enviado.`
            : `Esto le va a llegar a ${selectedIds.size} usuario(s). No se puede deshacer ni editar después de enviado.`
        }
        confirmLabel="Enviar"
        confirmVariant="danger"
        pending={broadcast.isPending}
        error={broadcast.isError ? "No se pudo enviar. Revisá el detalle arriba." : null}
      />
    </div>
  );
}
