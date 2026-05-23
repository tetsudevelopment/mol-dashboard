import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  NEXT_PUBLIC_API_VERSION: z.string().default("v1"),
});

const parsed = PublicEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
});

if (!parsed.success) {
  // Fail loud: missing or invalid env is a configuration bug, not a runtime concern.
  throw new Error(
    `Invalid public env vars:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
export type PublicEnv = z.infer<typeof PublicEnvSchema>;
