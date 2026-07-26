"use client";

import { useState } from "react";
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
  /** Current device_id bound to this station, prefilled when editing. Empty when creating. */
  defaultDeviceId?: string;
  submitLabel: string;
  /**
   * `deviceId` is the trimmed value of the device_id field, or null when left
   * empty. It's reported separately from `values` because it belongs to a
   * different resource (cabinet-devices, not stations) — the caller decides
   * whether to create/replace/clear the binding.
   */
  onSubmit: (values: CreateStationInput, deviceId: string | null) => void;
  onCancel: () => void;
  pending?: boolean;
  error?: unknown;
  deviceError?: unknown;
}

export function StationForm({
  defaultValues,
  defaultDeviceId = "",
  submitLabel,
  onSubmit,
  onCancel,
  pending = false,
  error,
  deviceError,
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
  const [deviceId, setDeviceId] = useState(defaultDeviceId);

  function submit(values: CreateStationInput) {
    onSubmit(values, deviceId.trim() || null);
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      data-testid="station-form"
      className="space-y-3"
    >
      <Field label="Nombre" htmlFor="name" error={errors.name?.message}>
        <TextInput id="name" data-testid="station-name" {...register("name")} />
      </Field>

      <Field label="Ciudad" htmlFor="city" error={errors.city?.message}>
        <TextInput id="city" data-testid="station-city" {...register("city")} />
      </Field>

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

      <Field label="Status" htmlFor="status" error={errors.status?.message}>
        <Select id="status" data-testid="station-status" {...register("status")}>
          <option value="online">online</option>
          <option value="offline">offline</option>
          <option value="maintenance">maintenance</option>
        </Select>
      </Field>

      <Field
        label="Device ID del gabinete"
        htmlFor="device_id"
        hint="Opcional. ID de hardware impreso en el gabinete físico (ej. DTA38300). Al guardar, la asignación al gabinete se crea, reemplaza o libera según corresponda."
      >
        <TextInput
          id="device_id"
          data-testid="station-device-id"
          placeholder="DTA38300"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />
      </Field>

      <ErrorBanner error={error} testId="station-form-error" />
      <ErrorBanner error={deviceError} testId="station-device-error" />

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
