"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ImageOff } from "lucide-react";
import type { z } from "zod";

import {
  CreateAdInputSchema,
  DEFAULT_IMAGE_DURATION_SECONDS,
  isUnsupportedVideoHost,
  type AdMediaType,
  type CreateAdInput,
} from "@/validators/ad.schema";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, TextInput } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";

type AdFormValues = z.input<typeof CreateAdInputSchema>;

interface Props {
  advertiserId: string;
  defaultValues?: Partial<AdFormValues>;
  submitLabel: string;
  onSubmit: (values: CreateAdInput) => void;
  onCancel: () => void;
  pending?: boolean;
  error?: unknown;
}

export function AdForm({
  advertiserId,
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
    control,
    setValue,
    formState: { errors },
  } = useForm<AdFormValues, unknown, CreateAdInput>({
    resolver: zodResolver(CreateAdInputSchema),
    defaultValues: {
      advertiser_id: advertiserId,
      media_type: "image",
      duration_seconds: DEFAULT_IMAGE_DURATION_SECONDS,
      is_active: true,
      sort_order: 0,
      ...defaultValues,
    },
  });

  const mediaUrl = useWatch({ control, name: "media_url" });
  const mediaType = useWatch({ control, name: "media_type" }) as AdMediaType;

  // Videos play for the length of the file — the duration field only makes
  // sense for images. Force it to null so we never submit a stale value.
  useEffect(() => {
    if (mediaType === "video") {
      setValue("duration_seconds", null);
    } else if (mediaType === "image") {
      setValue("duration_seconds", DEFAULT_IMAGE_DURATION_SECONDS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType]);

  const showPreview = typeof mediaUrl === "string" && /^https?:\/\//i.test(mediaUrl);
  const unsupportedVideoHost =
    mediaType === "video" && typeof mediaUrl === "string" && isUnsupportedVideoHost(mediaUrl);

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="ad-form" className="space-y-3">
      <Field label="Tipo de medio" htmlFor="media_type" error={errors.media_type?.message}>
        <Select id="media_type" data-testid="ad-media-type" {...register("media_type")}>
          <option value="image">Imagen</option>
          <option value="video">Video</option>
        </Select>
      </Field>

      <Field
        label="URL del medio"
        htmlFor="media_url"
        error={errors.media_url?.message}
        hint={
          mediaType === "video"
            ? "Debe ser un archivo directo (.mp4 / .webm). Los enlaces de YouTube o Vimeo no sirven: bloquean el autoplay embebido en el gabinete."
            : undefined
        }
      >
        <TextInput
          id="media_url"
          data-testid="ad-media-url"
          placeholder="https://…"
          {...register("media_url")}
        />
      </Field>

      {unsupportedVideoHost ? (
        <div
          role="alert"
          data-testid="ad-unsupported-video-host"
          className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Esa URL parece ser de YouTube o Vimeo. El gabinete no puede reproducirlos
            embebidos — subí el archivo a un hosting que sirva el .mp4/.webm directo.
          </span>
        </div>
      ) : null}

      <div>
        <span className="block text-sm font-medium">Vista previa</span>
        <div
          data-testid="ad-media-preview"
          className="mt-1 flex h-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {showPreview ? (
            // Remount on url/type change instead of resetting `failed` from
            // an effect — avoids the cascading-render setState-in-effect issue.
            <AdMediaPreview key={`${mediaType}-${mediaUrl}`} url={mediaUrl} type={mediaType} />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs text-zinc-400">
              <ImageOff className="size-5" aria-hidden />
              Pegá una URL para previsualizar
            </span>
          )}
        </div>
      </div>

      {mediaType === "image" ? (
        <Field
          label="Duración (segundos)"
          htmlFor="duration_seconds"
          error={errors.duration_seconds?.message}
          hint="Solo aplica a imágenes. Los videos duran lo que dure el archivo."
        >
          <TextInput
            id="duration_seconds"
            type="number"
            data-testid="ad-duration"
            {...register("duration_seconds", { valueAsNumber: true })}
          />
        </Field>
      ) : null}

      <Field
        label="Orden"
        htmlFor="sort_order"
        error={errors.sort_order?.message}
        hint="Orden de rotación entre los anuncios de esta misma empresa."
      >
        <TextInput
          id="sort_order"
          type="number"
          data-testid="ad-sort-order"
          {...register("sort_order", { valueAsNumber: true })}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox data-testid="ad-is-active" {...register("is_active")} />
        Activo
      </label>

      <ErrorBanner error={error} testId="ad-form-error" />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={pending}
          data-testid="ad-form-submit"
        >
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

// Keyed by url+type from the caller, so a new/changed URL remounts this
// component instead of needing an effect to reset `failed`.
function AdMediaPreview({ url, type }: { url: string; type: AdMediaType }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex flex-col items-center gap-1 text-xs text-red-500">
        <ImageOff className="size-5" aria-hidden />
        No se pudo cargar el medio. Revisá la URL.
      </span>
    );
  }

  if (type === "video") {
    return (
      <video
        src={url}
        muted
        controls
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // Arbitrary externally-hosted ad media — next/image requires
    // known remote patterns, which we can't have for admin-entered URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Vista previa del anuncio"
      className="h-full w-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}
