import { z } from "zod";

import { UuidSchema, IsoDateSchema } from "./common.schema";

export const UserRoleSchema = z.enum(["user", "admin", "superadmin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum([
  "active",
  "suspended",
  "inactive",
  "pending_verification",
]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const AuthProviderSchema = z.enum(["email", "google", "facebook"]);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const AdminUserSchema = z.object({
  id: UuidSchema,
  email: z.string().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  auth_provider: AuthProviderSchema,
  role: UserRoleSchema,
  status: UserStatusSchema,
  email_verified: z.boolean(),
  created_at: IsoDateSchema,
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const UpdateUserRoleInputSchema = z.object({
  role: UserRoleSchema,
});
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleInputSchema>;
