"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import {
  CreateStationInputSchema,
  type CreateStationInput,
} from "@/validators/station.schema";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";

type StationFormValues = z.input<typeof CreateStationInputSchema>;

interface Props {
  defaultValues?: Partial<StationFormValues>;
  submitLabel: string;
  onSubmit: (values: CreateStationInput) => void;
  onCancel: () => void;
  pending?: boolean;
  error?: unknown;
}

export function StationForm({
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
  } = useForm<StationFormValues, unknown, CreateStationInput>({
    resolver: zodResolver(CreateStationInputSchema),
    defaultValues: {
      currency: "COP",
      total_capacity: 0,
      status: "online",
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      data-testid="station-form"
      className="space-y-3"
    >
      <Field label="Nombre" htmlFor="name" error={errors.name?.message}>
        <TextInput id="name" data-testid="station-name" {...register("name")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ciudad" htmlFor="city" error={errors.city?.message}>
          <TextInput id="city" data-testid="station-city" {...register("city")} />
        </Field>
        <Field label="Zona" htmlFor="zone" error={errors.zone?.message}>
          <TextInput id="zone" data-testid="station-zone" {...register("zone")} />
        </Field>
      </div>

      <Field label="Dirección" htmlFor="address" error={errors.address?.message}>
        <TextInput id="address" data-testid="station-address" {...register("address")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitud" htmlFor="latitude" error={errors.latitude?.message}>
          <TextInput
            id="latitude"
            type="number"
            step="any"
            data-testid="station-latitude"
            {...register("latitude", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Longitud" htmlFor="longitude" error={errors.longitude?.message}>
          <TextInput
            id="longitude"
            type="number"
            step="any"
            data-testid="station-longitude"
            {...register("longitude", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="Tarifa hora"
          htmlFor="hourly_rate"
          error={errors.hourly_rate?.message}
          hint="En la moneda del gabinete"
        >
          <TextInput
            id="hourly_rate"
            type="number"
            step="any"
            data-testid="station-hourly-rate"
            {...register("hourly_rate", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Moneda" htmlFor="currency" error={errors.currency?.message}>
          <TextInput id="currency" maxLength={3} {...register("currency")} />
        </Field>
        <Field
          label="Capacidad"
          htmlFor="total_capacity"
          error={errors.total_capacity?.message}
          hint="Total de slots"
        >
          <TextInput
            id="total_capacity"
            type="number"
            data-testid="station-capacity"
            {...register("total_capacity", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Status" htmlFor="status" error={errors.status?.message}>
          <Select id="status" data-testid="station-status" {...register("status")}>
            <option value="online">online</option>
            <option value="offline">offline</option>
            <option value="maintenance">maintenance</option>
          </Select>
        </Field>
        <Field label="Abre" htmlFor="opening_time" error={errors.opening_time?.message}>
          <TextInput
            id="opening_time"
            type="time"
            {...register("opening_time")}
          />
        </Field>
        <Field label="Cierra" htmlFor="closing_time" error={errors.closing_time?.message}>
          <TextInput
            id="closing_time"
            type="time"
            {...register("closing_time")}
          />
        </Field>
      </div>

      <Field label="Descripción" htmlFor="description" error={errors.description?.message}>
        <TextInput id="description" {...register("description")} />
      </Field>

      <ErrorBanner error={error} testId="station-form-error" />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={pending}
          data-testid="station-form-submit"
        >
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
