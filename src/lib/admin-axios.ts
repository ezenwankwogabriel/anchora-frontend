import axios from "axios";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { ServiceError } from "./types";

const adminHttp = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

adminHttp.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminHttp.interceptors.response.use(
  (res) => {
    // Unwrap the global ResponseTransformInterceptor envelope { data, meta: { timestamp } }
    if (res.data && typeof res.data === "object" && "data" in res.data) {
      res.data = res.data.data;
    }
    return res;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAdminAuthStore.getState().clearAuth();
      if (typeof window !== "undefined" && window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default adminHttp;

export function normaliseAdmin(err: unknown): never {
  if (axios.isAxiosError(err)) {
    throw new ServiceError(
      (err.response?.data as { message?: string })?.message ?? "Something went wrong",
      err.response?.status ?? 500
    );
  }
  throw err;
}
