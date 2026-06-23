import adminHttp, { normaliseAdmin } from "@/lib/admin-axios";
import type {
  AdminAuthResponse,
  AdminUser,
  AdminUserListItem,
  AdminUserDetail,
  AdminRelease,
  AdminReleaseDetail,
  AuditLogPage,
  AdminAccount,
  PaginatedList,
  DevUserState,
  UserPlan,
} from "@/lib/admin-types";

export const AdminService = {
  // ── Auth ────────────────────────────────────────────────────────────────────

  login: async (data: {
    email: string;
    password: string;
  }): Promise<AdminAuthResponse> => {
    try {
      const { data: loginBody } = await adminHttp.post<{ token: string }>("/admin/auth/login", data);
      const accessToken = loginBody.token;
      const { data: admin } = await adminHttp.get<AdminUser>("/admin/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return { admin, accessToken };
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
      return (await adminHttp.get<PaginatedList<AdminUserListItem>>("/admin/users", { params })).data;
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
      await adminHttp.patch(`/admin/users/${id}/suspend`, { reason });
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  reactivateUser: async (id: string): Promise<void> => {
    try {
      await adminHttp.patch(`/admin/users/${id}/reactivate`);
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  updateUserPlan: async (id: string, plan: UserPlan): Promise<void> => {
    try {
      await adminHttp.post(`/admin/users/${id}/plan`, { plan });
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
      return (await adminHttp.get<AdminAccount[]>("/admin/auth/admins")).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  createAdmin: async (data: {
    email: string;
    role: "ADMIN" | "READ_ONLY";
  }): Promise<AdminAccount> => {
    try {
      return (await adminHttp.post<AdminAccount>("/admin/auth/admins", data)).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  deactivateAdmin: async (id: string): Promise<void> => {
    try {
      await adminHttp.patch(`/admin/auth/admins/${id}/deactivate`);
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  // ── Dev Tools ───────────────────────────────────────────────────────────────

  devGetUserState: async (q: string): Promise<DevUserState> => {
    try {
      return (
        await adminHttp.get<DevUserState>("/admin/dev/users/state", {
          params: { q },
        })
      ).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  devSetStage: async (
    userId: string,
    stage: string,
    backdateDays?: number,
  ): Promise<DevUserState> => {
    try {
      return (
        await adminHttp.post<DevUserState>(
          `/admin/dev/users/${userId}/set-stage`,
          { stage, ...(backdateDays !== undefined ? { backdateDays } : {}) },
        )
      ).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  devRunInactivityCheck: async (userId: string): Promise<DevUserState> => {
    try {
      return (
        await adminHttp.post<DevUserState>(
          `/admin/dev/users/${userId}/run-inactivity-check`,
        )
      ).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },

  devResetUser: async (userId: string): Promise<DevUserState> => {
    try {
      return (
        await adminHttp.post<DevUserState>(`/admin/dev/users/${userId}/reset`)
      ).data;
    } catch (err) {
      normaliseAdmin(err);
    }
  },
};
