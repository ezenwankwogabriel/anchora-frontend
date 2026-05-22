import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { ServiceError, type User } from "./types";

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

// On 401: attempt silent token refresh then retry once
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await http.post<{ accessToken: string; user: User }>(
          "/auth/refresh"
        );
        useAuthStore.getState().setAuth(data.user, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return http(original);
      } catch {
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
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
