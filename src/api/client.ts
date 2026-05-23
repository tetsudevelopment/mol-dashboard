import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";
import { useAuthStore, getAccessToken } from "@/stores/auth.store";
import { ApiClientError, type ApiEnvelope } from "./types";

const baseURL = `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/${env.NEXT_PUBLIC_API_VERSION}`;

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// ─── 401 refresh logic ────────────────────────────────────────────────────
//
// Access tokens are short-lived (15 min). When one expires the back returns
// 401 UNAUTHORIZED. We catch that, call POST /auth/refresh using the stored
// refresh token (30-day TTL), then retry the original request with the new
// access token.
//
// A shared in-flight promise deduplicates concurrent 401s: if multiple
// requests fail at the same time, only ONE refresh call fires and the rest
// await its result.
//
// If the refresh ALSO fails (refresh token expired or family revoked), the
// session is cleared and the user is sent to /login.

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

// Separate axios instance for the refresh call — avoids recursing through
// this file's response interceptor, which would otherwise turn a single 401
// into an infinite loop.
const refreshAxios = axios.create({ baseURL, timeout: 15_000 });

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight !== null) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = useAuthStore.getState().refreshToken;
    if (!refresh) return null;
    try {
      const res = await refreshAxios.post<ApiEnvelope<unknown>>("/auth/refresh", {
        refresh_token: refresh,
      });
      const envelope = res.data;
      if (envelope?.error || !envelope?.data) return null;
      const body = envelope.data as {
        access_token?: string;
        refresh_token?: string;
      };
      if (typeof body.access_token !== "string") return null;

      // Refresh tokens are rotated on every successful refresh — persist the new
      // one too, otherwise the next refresh will fail with REFRESH_TOKEN_REUSED.
      useAuthStore.getState().setAccessToken(body.access_token);
      if (typeof body.refresh_token === "string") {
        useAuthStore.getState().setRefreshToken(body.refresh_token);
      }
      return body.access_token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function isOnLoginPage(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname === "/login";
}

function handleAuthFailure(): void {
  useAuthStore.getState().clear();
  if (typeof window !== "undefined" && !isOnLoginPage()) {
    window.location.replace("/login");
  }
}

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope<unknown>>) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0;
    const original = error.config as RetryableRequest | undefined;

    // Don't try to refresh on the refresh/login endpoints themselves — that's
    // how you build an infinite loop. Also skip if we've already retried once.
    const url = original?.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/refresh") || url.includes("/auth/login");

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken !== null) {
        // Reissue the original request with the fresh token.
        if (typeof (original.headers as { set?: unknown }).set === "function") {
          (original.headers as { set: (k: string, v: string) => void }).set(
            "Authorization",
            `Bearer ${newToken}`,
          );
        } else {
          (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        }
        return await apiClient.request(original);
      }
      // Refresh failed → session is dead, kick to /login.
      handleAuthFailure();
    }

    const envelope = error.response?.data;
    const apiError = envelope?.error;
    throw new ApiClientError({
      code: apiError?.code ?? mapStatusToCode(status, error.code),
      message: apiError?.message ?? error.message ?? "Unknown error",
      status,
      details: apiError?.details,
      requestId: apiError?.requestId,
    });
  },
);

function mapStatusToCode(status: number, axiosCode?: string): string {
  if (status === 0) return axiosCode ?? "NETWORK_ERROR";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "REQUEST_FAILED";
}

export async function unwrap<T>(
  promise: Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<T> {
  const response = await promise;
  const envelope = response.data;
  if (envelope?.error) {
    throw new ApiClientError({
      code: envelope.error.code,
      message: envelope.error.message,
      status: response.status,
      details: envelope.error.details,
      requestId: envelope.error.requestId,
    });
  }
  if (envelope?.data === undefined || envelope.data === null) {
    return null as T;
  }
  return envelope.data as T;
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
