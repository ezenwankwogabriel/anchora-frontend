import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { ServiceError } from "./types";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Seed the Authorization header from whatever token is already in storage.
const initialToken = useAuthStore.getState().accessToken;
if (initialToken) {
  http.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Keep the Authorization header in sync with the auth store.
// Zustand's subscribe fires synchronously on every set() call, so this catches
// login, token refresh, and logout immediately — no per-request store reads needed.
useAuthStore.subscribe((state) => {
  if (state.accessToken) {
    http.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
  } else {
    delete http.defaults.headers.common['Authorization'];
  }
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
    const ignoredEndpoints = ["/auth/refresh", "/auth/login"].includes(original.url ?? "");

    // Don't intercept the refresh call/login itself — avoids infinite loops.
    if (error.response?.status === 401 && !original._retry && !ignoredEndpoints) {
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
    const data = err.response?.data as { message?: string; error?: string };
    throw new ServiceError(
      data?.message ?? "Something went wrong",
      err.response?.status ?? 500,
      data?.error,
    );
  }
  throw err;
}
