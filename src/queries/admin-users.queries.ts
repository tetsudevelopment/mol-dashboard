import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteUser,
  getUser,
  listUsers,
  updateUserRole,
  type ListUsersFilters,
} from "@/api/endpoints/admin-users";
import type { UpdateUserRoleInput } from "@/validators/user.schema";
import { queryKeys } from "./query-keys";

export function useUsers(filters: ListUsersFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.users.list(filters as Record<string, unknown>),
    queryFn: () => listUsers(filters),
    // Keep the current page on screen while the next one loads — otherwise
    // every page change blanks the table and flashes the loading row.
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.admin.users.byId(id) : ["admin", "users", "none"],
    queryFn: () => getUser(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserRoleInput }) =>
      updateUserRole(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.byId(vars.id) });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    },
  });
}
