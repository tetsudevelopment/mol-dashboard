"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { isAdminRole, useAuthStore } from "@/stores/auth.store";

/**
 * Wraps the dashboard layout. Reads the persisted auth session from Zustand
 * (hydrated from localStorage) and:
 *   - redirects to /login if there's no token or the user is not admin
 *   - shows a tiny loading state while hydrating
 *
 * We use useSyncExternalStore to read `hasHydrated` so we don't redirect
 * during the SSR/hydration window before persist has loaded localStorage.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );

  const isAuthorized =
    hasHydrated && Boolean(accessToken) && Boolean(user) && isAdminRole(user?.role);

  useEffect(() => {
    if (hasHydrated && !isAuthorized) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthorized, router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-400" aria-hidden />
      </div>
    );
  }
  return <>{children}</>;
}
