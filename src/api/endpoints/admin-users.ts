import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  AdminUserSchema,
  type AdminUser,
  type UserRole,
  type UserStatus,
  type UpdateUserRoleInput,
} from "@/validators/user.schema";

const ListResponseSchema = z.object({
  users: z.array(AdminUserSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const SingleResponseSchema = z.object({ user: AdminUserSchema });

const DeleteResponseSchema = z.object({ id: z.string() });

export interface ListUsersFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listUsers(
  filters: ListUsersFilters = {},
): Promise<{ users: AdminUser[]; total: number; page: number; pageSize: number }> {
  const params: Record<string, string | number> = {};
  if (filters.role !== undefined) params.role = filters.role;
  if (filters.status !== undefined) params.status = filters.status;
  if (filters.search !== undefined && filters.search.length > 0) params.search = filters.search;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>("/admin/users", { params }));
  return ListResponseSchema.parse(raw);
}

export async function getUser(id: string): Promise<AdminUser> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>(`/admin/users/${id}`));
  return SingleResponseSchema.parse(raw).user;
}

export async function updateUserRole(
  id: string,
  input: UpdateUserRoleInput,
): Promise<AdminUser> {
  const raw = await unwrap(
    apiClient.patch<ApiEnvelope<unknown>>(`/admin/users/${id}/role`, input),
  );
  return SingleResponseSchema.parse(raw).user;
}

export async function deleteUser(id: string): Promise<{ id: string }> {
  const raw = await unwrap(
    apiClient.delete<ApiEnvelope<unknown>>(`/admin/users/${id}`),
  );
  return DeleteResponseSchema.parse(raw);
}
