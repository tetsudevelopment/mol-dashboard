"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import {
  CreateCampaignInputSchema,
  type CreateCampaignInput,
} from "@/validators/campaign.schema";
import { useAdvertisers } from "@/queries/admin-advertisers.queries";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, TextInput } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";

type CampaignFormValues = z.input<typeof CreateCampaignInputSchema>;

interface Props {
  defaultValues?: Partial<CampaignFormValues>;
  submitLabel: string;
  onSubmit: (values: CreateCampaignInput) => void;
  onCancel: () => void;
  pending?: boolean;
  error?: unknown;
  /**
   * Advertiser assignment is immutable after creation (mirrors the
   * backend's UpdateCampaignSchema, which omits advertiser_id) — hide the
   * picker in edit mode. The advertiser_id must still arrive via
   * `defaultValues` so the (unregistered) field keeps submitting correctly.
   */
  editing?: boolean;
}

export function CampaignForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  pending = false,
  error,
  editing = false,
}: Props) {
  const advertisersQuery = useAdvertisers();
  const advertisers = advertisersQuery.data?.advertisers ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignFormValues, unknown, CreateCampaignInput>({
    resolver: zodResolver(CreateCampaignInputSchema),
    defaultValues: {
      weight: 1,
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      data-testid="campaign-form"
      className="space-y-3"
    >
      {!editing ? (
        <Field
          label="Empresa anunciante"
          htmlFor="advertiser_id"
          error={errors.advertiser_id?.message}
        >
          <Select
            id="advertiser_id"
            data-testid="campaign-advertiser"
            {...register("advertiser_id")}
          >
            <option value="">Seleccioná una empresa…</option>
            {advertisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="Nombre de la campaña" htmlFor="name" error={errors.name?.message}>
        <TextInput id="name" data-testid="campaign-name" {...register("name")} />
      </Field>

      <Field
        label="Peso"
        htmlFor="weight"
        error={errors.weight?.message}
        hint="Frecuencia de aparición relativa. A mayor peso, más seguido rota frente a las demás campañas activas asignadas al mismo gabinete."
      >
        <TextInput
          id="weight"
          type="number"
          data-testid="campaign-weight"
          {...register("weight", { valueAsNumber: true })}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox data-testid="campaign-is-active" {...register("is_active")} />
        Activa
      </label>

      <ErrorBanner error={error} testId="campaign-form-error" />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={pending}
          data-testid="campaign-form-submit"
        >
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
