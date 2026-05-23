import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import { AdminUserSchema, type AdminUser } from "@/validators/user.schema";

const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().int(),
  user: AdminUserSchema.partial({ phone: true, email: true }).extend({
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
});

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AdminUser;
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>("/auth/login", credentials),
  );
  const parsed = LoginResponseSchema.parse(raw);
  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token,
    expiresIn: parsed.expires_in,
    user: parsed.user as AdminUser,
  };
}
