import adminHttp, { normaliseAdmin } from "@/lib/admin-axios";
import type {
  AdminAuthResponse,
  AdminUserListItem,
  AdminUserDetail,
  AdminRelease,
  AdminReleaseDetail,
  AuditLogPage,
  AdminAccount,
  PaginatedList,
} from "@/lib/admin-types";

export const AdminService = {
  // ── Auth ────────────────────────────────────────────────────────────────────

  login: async (data: {
    email: string;
    password: string;
  }): Promise<AdminAuthResponse> => {
    try {
      return (await adminHttp.post<AdminAuthResponse>("/admin/auth/login", data)).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  // ── Users ───────────────────────────────────────────────────────────────────

  getUsers: async (params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedList<AdminUserListItem>> => {
    try {
      return (
        await adminHttp.get<PaginatedList<AdminUserListItem>>("/admin/users", { params })
      ).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  getUser: async (id: string): Promise<AdminUserDetail> => {
    try {
      return (await adminHttp.get<AdminUserDetail>(`/admin/users/${id}`)).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  suspendUser: async (id: string, reason: string): Promise<void> => {
    try {
      await adminHttp.post(`/admin/users/${id}/suspend`, { reason });
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  reactivateUser: async (id: string): Promise<void> => {
    try {
      await adminHttp.post(`/admin/users/${id}/reactivate`);
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  // ── Releases ────────────────────────────────────────────────────────────────

  getReleases: async (params: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedList<AdminRelease>> => {
    try {
      return (
        await adminHttp.get<PaginatedList<AdminRelease>>("/admin/releases", { params })
      ).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  getRelease: async (id: string): Promise<AdminReleaseDetail> => {
    try {
      return (await adminHttp.get<AdminReleaseDetail>(`/admin/releases/${id}`)).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  cancelRelease: async (id: string, reason: string): Promise<void> => {
    try {
      await adminHttp.post(`/admin/releases/${id}/cancel`, { reason });
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  // ── Audit Logs ──────────────────────────────────────────────────────────────

  getAuditLogs: async (params: {
    cursor?: string;
    limit?: number;
    type?: string;
    from?: string;
    to?: string;
  }): Promise<AuditLogPage> => {
    try {
      return (
        await adminHttp.get<AuditLogPage>("/admin/audit-logs", { params })
      ).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  exportAuditLogs: async (params: {
    type?: string;
    from?: string;
    to?: string;
  }): Promise<Blob> => {
    try {
      const res = await adminHttp.get("/admin/audit-logs/export", {
        params,
        responseType: "blob",
      });
      return res.data as Blob;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  // ── Admin Accounts ──────────────────────────────────────────────────────────

  getAdmins: async (): Promise<AdminAccount[]> => {
    try {
      return (await adminHttp.get<AdminAccount[]>("/admin/admins")).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  createAdmin: async (data: {
    email: string;
    role: "ADMIN" | "READ_ONLY";
  }): Promise<AdminAccount> => {
    try {
      return (await adminHttp.post<AdminAccount>("/admin/admins", data)).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  deactivateAdmin: async (id: string): Promise<void> => {
    try {
      await adminHttp.delete(`/admin/admins/${id}`);
    } catch (err) {
      normaliseAdmin(err);
    }
  },
};
