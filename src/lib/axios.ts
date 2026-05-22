import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { ServiceError } from "./types";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Inject access token on every request
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Strip the global { data, meta } response envelope
http.interceptors.response.use((res) => {
  if (res.data && typeof res.data === "object" && "data" in res.data && "meta" in res.data) {
    res.data = res.data.data;
  }
  return res;
});

// Singleton so concurrent 401s share one in-flight refresh rather than each
// firing their own — prevents session rotation race on the frontend.
let refreshPromise: Promise<{ accessToken: string; refreshToken: string; sessionId: string }> | null = null;

// On 401: attempt silent token refresh then retry once
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const isRefreshEndpoint = (original.url ?? "").includes("/auth/refresh");

    // Don't intercept the refresh call itself — avoids infinite loops.
    if (error.response?.status === 401 && !original._retry && !isRefreshEndpoint) {
      original._retry = true;
      const { refreshToken, sessionId, user } = useAuthStore.getState();

      if (refreshToken && sessionId && user) {
        try {
          if (!refreshPromise) {
            refreshPromise = http
              .post<{ accessToken: string; refreshToken: string; sessionId: string }>(
                "/auth/refresh",
                { refreshToken, sessionId },
              )
              .then((r) => r.data)
              .finally(() => { refreshPromise = null; });
          }

          const data = await refreshPromise;
          useAuthStore.getState().setAuth(user, data.accessToken, data.refreshToken, data.sessionId);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return http(original);
        } catch {
          // refresh failed — fall through to clearAuth
        }
      }

      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default http;

// Shared error normaliser — import in every service instead of duplicating
export function normalise(err: unknown): never {
  if (axios.isAxiosError(err)) {
    throw new ServiceError(
      (err.response?.data as { message?: string })?.message ?? "Something went wrong",
      err.response?.status ?? 500
    );
  }
  throw err;
}
