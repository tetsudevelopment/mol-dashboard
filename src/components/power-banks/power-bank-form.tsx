"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import {
  CreatePowerBankInputSchema,
  type CreatePowerBankInput,
} from "@/validators/power-bank.schema";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";
import {
  MAX_POWER_BANKS_PER_STATION,
  isStationFull,
  type Station,
} from "@/validators/station.schema";

type PowerBankFormValues = z.input<typeof CreatePowerBankInputSchema>;

interface Props {
  stations: Station[];
  defaultValues?: Partial<PowerBankFormValues>;
  submitLabel: string;
  onSubmit: (values: CreatePowerBankInput) => void;
  onCancel: () => void;
  pending?: boolean;
  error?: unknown;
  lockStation?: boolean;
}

export function PowerBankForm({
  stations,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  pending = false,
  error,
  lockStation = false,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PowerBankFormValues, unknown, CreatePowerBankInput>({
    resolver: zodResolver(CreatePowerBankInputSchema),
    defaultValues: {
      status: "available",
      battery_level: 100,
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      data-testid="power-bank-form"
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Código" htmlFor="code" error={errors.code?.message}>
          <TextInput id="code" data-testid="pb-code" {...register("code")} />
        </Field>
        <Field label="Modelo" htmlFor="model" error={errors.model?.message}>
          <TextInput id="model" data-testid="pb-model" {...register("model")} />
        </Field>
      </div>

      <Field label="QR Code" htmlFor="qr_code" error={errors.qr_code?.message}>
        <TextInput id="qr_code" data-testid="pb-qr-code" {...register("qr_code")} />
      </Field>

      <Field
        label="Gabinete"
        htmlFor="station_id"
        error={errors.station_id?.message}
        hint={
          lockStation
            ? undefined
            : `Máximo ${String(MAX_POWER_BANKS_PER_STATION)} baterías por gabinete. Los marcados como LLENO no se pueden seleccionar.`
        }
      >
        <Select
          id="station_id"
          data-testid="pb-station"
          disabled={lockStation}
          {...register("station_id")}
        >
          <option value="">Seleccionar gabinete…</option>
          {stations.map((s) => {
            const full = isStationFull(s);
            // Allow the currently-assigned station even if it would otherwise
            // be at capacity (we're editing — the existing PB counts toward it).
            const isSameAsDefault =
              lockStation || defaultValues?.station_id === s.id;
            const disabled = full && !isSameAsDefault;
            return (
              <option key={s.id} value={s.id} disabled={disabled}>
                {s.name} — {s.city} ({s.power_banks_count}/
                {MAX_POWER_BANKS_PER_STATION}
                {full ? " · LLENO" : ""})
              </option>
            );
          })}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Status" htmlFor="status" error={errors.status?.message}>
          <Select id="status" data-testid="pb-status" {...register("status")}>
            <option value="available">available</option>
            <option value="charging">charging</option>
            <option value="damaged">damaged</option>
            <option value="retired">retired</option>
            <option value="rented">rented</option>
          </Select>
        </Field>
        <Field
          label="Batería (%)"
          htmlFor="battery_level"
          error={errors.battery_level?.message}
        >
          <TextInput
            id="battery_level"
            type="number"
            min={0}
            max={100}
            data-testid="pb-battery"
            {...register("battery_level", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <ErrorBanner error={error} testId="pb-form-error" />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={pending} data-testid="pb-form-submit">
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
