import { z } from "zod";

export const UuidSchema = z.uuid();

export const DecimalStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, "Must be a decimal string like '5000.50'");

export const IsoDateSchema = z.iso.datetime({ offset: true });

export const EmailSchema = z.email().max(254);

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Uuid = z.infer<typeof UuidSchema>;
export type DecimalString = z.infer<typeof DecimalStringSchema>;
export type IsoDate = z.infer<typeof IsoDateSchema>;
