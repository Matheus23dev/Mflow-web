import { api } from "@/shared/lib/api";
import type { AuthSession } from "@/shared/types";

export const authService = {
  setupStatus: () => api<{ needsSetup: boolean }>("/auth/setup-status"),
  authenticate: (mode: "login" | "register", payload: { name?: string; email: string; password: string }) =>
    api<AuthSession>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) }),
};
