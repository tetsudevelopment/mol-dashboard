"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, ShieldAlert } from "lucide-react";

import { ApiClientError } from "@/api/types";
import { useLogin } from "@/queries/auth.queries";
import { isAdminRole, useAuthStore } from "@/stores/auth.store";
import { env } from "@/lib/env";

const LoginFormSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
type LoginFormValues = z.infer<typeof LoginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const clear = useAuthStore((s) => s.clear);
  const [nonAdminWarning, setNonAdminWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setNonAdminWarning(null);
    try {
      const result = await login.mutateAsync(values);
      if (!isAdminRole(result.user.role)) {
        clear();
        setNonAdminWarning(
          `Tu cuenta tiene rol "${result.user.role}". El dashboard requiere rol "admin" o "superadmin".`,
        );
        return;
      }
      router.push("/");
    } catch {
      // Error rendered below from login.error.
    }
  }

  const apiError =
    login.error instanceof ApiClientError
      ? `[${login.error.code}] ${login.error.message}`
      : login.error instanceof Error
        ? login.error.message
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="size-8 rounded bg-[color:var(--brand-red)]" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">MOLTECH Dashboard</h1>
            <p className="text-xs text-zinc-500">Admin login — {env.NEXT_PUBLIC_API_URL}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              data-testid="login-email"
              {...register("email")}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              data-testid="login-password"
              {...register("password")}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            data-testid="login-submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <LogIn className="size-4" aria-hidden />
            {login.isPending ? "Entrando…" : "Entrar"}
          </button>

          {apiError ? (
            <div
              role="alert"
              data-testid="login-error"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {apiError}
            </div>
          ) : null}

          {nonAdminWarning ? (
            <div
              role="alert"
              data-testid="login-non-admin"
              className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{nonAdminWarning}</span>
            </div>
          ) : null}
        </form>

        <p className="mt-4 text-xs text-zinc-500">
          Solo usuarios con rol <code>admin</code> o <code>superadmin</code> pueden acceder al
          dashboard.
        </p>
      </div>
    </div>
  );
}
