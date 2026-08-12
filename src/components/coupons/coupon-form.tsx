"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import {
  CreateCouponInputSchema,
  type CreateCouponInput,
} from "@/validators/coupon.schema";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";

type CouponFormValues = z.input<typeof CreateCouponInputSchema>;

interface Props {
  defaultValues?: Partial<CouponFormValues>;
  submitLabel: string;
  /** When true the code field is shown read-only — an existing code is never renamed. */
  codeLocked?: boolean;
  onSubmit: (values: CreateCouponInput) => void;
  onCancel: () => void;
  pending?: boolean;
  error?: unknown;
}

export function CouponForm({
  defaultValues,
  submitLabel,
  codeLocked = false,
  onSubmit,
  onCancel,
  pending = false,
  error,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CouponFormValues, unknown, CreateCouponInput>({
    resolver: zodResolver(CreateCouponInputSchema),
    defaultValues: {
      discount_type: "percentage",
      status: "active",
      ...defaultValues,
    },
  });

  // useWatch, not watch(): the React Compiler cannot memoize RHF's watch()
  // safely, and the rest of this codebase already standardised on useWatch.
  const discountType = useWatch({ control, name: "discount_type" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="coupon-form" className="space-y-3">
      <Field
        label="Código"
        htmlFor="code"
        error={errors.code?.message}
        hint={
          codeLocked
            ? "El código no se puede cambiar: ya puede estar impreso o compartido. Creá uno nuevo y deshabilitá este."
            : "Lo que el usuario escribe en la app. Se guarda en mayúsculas."
        }
      >
        <TextInput
          id="code"
          data-testid="coupon-code"
          readOnly={codeLocked}
          autoCapitalize="characters"
          className={codeLocked ? "bg-neutral-100 dark:bg-neutral-800" : undefined}
          {...register("code")}
        />
      </Field>

      <Field label="Descripción" htmlFor="description" error={errors.description?.message}>
        <TextInput
          id="description"
          data-testid="coupon-description"
          placeholder="Ej: 25% de descuento — campaña de agosto"
          {...register("description")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo" htmlFor="discount_type" error={errors.discount_type?.message}>
          <Select id="discount_type" data-testid="coupon-discount-type" {...register("discount_type")}>
            <option value="percentage">Porcentaje</option>
            <option value="fixed_amount">Monto fijo</option>
          </Select>
        </Field>

        <Field
          label={discountType === "percentage" ? "Porcentaje (%)" : "Monto (COP)"}
          htmlFor="discount_value"
          error={errors.discount_value?.message}
          hint={
            discountType === "percentage"
              ? "Hasta 100."
              : "Nunca descuenta más de lo que cuesta el alquiler."
          }
        >
          {/* Text, not number: money stays a decimal string end to end. */}
          <TextInput
            id="discount_value"
            inputMode="decimal"
            data-testid="coupon-discount-value"
            placeholder={discountType === "percentage" ? "25" : "3000"}
            {...register("discount_value")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Válido desde" htmlFor="start_date" error={errors.start_date?.message}>
          <TextInput
            id="start_date"
            type="datetime-local"
            data-testid="coupon-start-date"
            {...register("start_date")}
          />
        </Field>

        <Field label="Válido hasta" htmlFor="end_date" error={errors.end_date?.message}>
          <TextInput
            id="end_date"
            type="datetime-local"
            data-testid="coupon-end-date"
            {...register("end_date")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Límite de usos"
          htmlFor="max_uses"
          error={errors.max_uses?.message}
          hint="Vacío = sin límite."
        >
          <TextInput
            id="max_uses"
            type="number"
            data-testid="coupon-max-uses"
            {...register("max_uses", {
              // An empty field must mean "unlimited" (null), not NaN.
              setValueAs: (value: string) => (value === "" ? null : Number(value)),
            })}
          />
        </Field>

        <Field label="Estado" htmlFor="status" error={errors.status?.message}>
          <Select id="status" data-testid="coupon-status" {...register("status")}>
            <option value="active">Activo</option>
            <option value="disabled">Deshabilitado</option>
            <option value="expired">Expirado</option>
          </Select>
        </Field>
      </div>

      <ErrorBanner error={error} testId="coupon-form-error" />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={pending}
          data-testid="coupon-form-submit"
        >
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
