import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { AdminUser, UserRole } from "@/validators/user.schema";

export interface AuthSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: AdminUser | null;
}

type AuthState = AuthSession & {
  setSession: (session: AuthSession) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setUser: (user: AdminUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
        }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "moltech-dashboard:auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export const ADMIN_ROLES: ReadonlyArray<UserRole> = ["admin", "superadmin"];

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role !== null && role !== undefined && ADMIN_ROLES.includes(role);
}
