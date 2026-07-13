"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import {
  CreateAdvertiserInputSchema,
  type CreateAdvertiserInput,
} from "@/validators/advertiser.schema";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, TextInput } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";

type AdvertiserFormValues = z.input<typeof CreateAdvertiserInputSchema>;

interface Props {
  defaultValues?: Partial<AdvertiserFormValues>;
  submitLabel: string;
  onSubmit: (values: CreateAdvertiserInput) => void;
  onCancel: () => void;
  pending?: boolean;
  error?: unknown;
}

export function AdvertiserForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  pending = false,
  error,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdvertiserFormValues, unknown, CreateAdvertiserInput>({
    resolver: zodResolver(CreateAdvertiserInputSchema),
    defaultValues: {
      weight: 1,
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      data-testid="advertiser-form"
      className="space-y-3"
    >
      <Field label="Nombre de la empresa" htmlFor="name" error={errors.name?.message}>
        <TextInput id="name" data-testid="advertiser-name" {...register("name")} />
      </Field>

      <Field
        label="Peso"
        htmlFor="weight"
        error={errors.weight?.message}
        hint="Frecuencia de aparición relativa. A mayor peso, más seguido rota frente a las demás empresas activas."
      >
        <TextInput
          id="weight"
          type="number"
          data-testid="advertiser-weight"
          {...register("weight", { valueAsNumber: true })}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox data-testid="advertiser-is-active" {...register("is_active")} />
        Activa
      </label>

      <ErrorBanner error={error} testId="advertiser-form-error" />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={pending}
          data-testid="advertiser-form-submit"
        >
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
