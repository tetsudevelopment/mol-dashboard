import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
});

export const ApiMetaSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  total: z.number().optional(),
  hasMore: z.boolean().optional(),
});

export const ApiEnvelopeSchema = z.object({
  data: z.unknown().nullable().optional(),
  meta: ApiMetaSchema.optional(),
  error: ApiErrorSchema.nullable().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiMeta = z.infer<typeof ApiMetaSchema>;
export type ApiEnvelope<T> = {
  data?: T | null;
  meta?: ApiMeta;
  error?: ApiError | null;
};

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(args: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
    requestId?: string;
  }) {
    super(args.message);
    this.name = "ApiClientError";
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
    this.requestId = args.requestId;
  }
}
