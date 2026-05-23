import { useMutation } from "@tanstack/react-query";
import { login, type LoginCredentials, type LoginResult } from "@/api/endpoints/auth";
import { useAuthStore } from "@/stores/auth.store";

export function useLogin(): ReturnType<
  typeof useMutation<LoginResult, Error, LoginCredentials>
> {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation<LoginResult, Error, LoginCredentials>({
    mutationFn: (credentials) => login(credentials),
    onSuccess: (result) => {
      setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    },
  });
}
