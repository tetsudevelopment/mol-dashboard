"use client";

import { Modal } from "./modal";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  confirmVariant = "danger",
  pending = false,
  error,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  pending?: boolean;
  error?: string | null;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="sm">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      {error ? (
        <p
          role="alert"
          data-testid="confirm-dialog-error"
          className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={pending}
          data-testid="confirm-dialog-confirm"
        >
          {pending ? "Procesando…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
