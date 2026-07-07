import { api } from "./client";
import type { User } from "../types/models";

export const authApi = {
  requestOtp: (phoneNumber: string) =>
    api.post<{ resendAvailableInSeconds: number }>("/auth/otp/request", { phoneNumber }),

  verifyOtp: (phoneNumber: string, code: string, displayName?: string) =>
    api.post<{ accessToken: string; isNewUser: boolean }>("/auth/otp/verify", {
      phoneNumber,
      code,
      displayName,
    }),

  me: () => api.get<User>("/auth/me"),
};
