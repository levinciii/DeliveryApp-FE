import type { ApiErrorBody, TokenPair } from "@delivery/shared-types";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearSession, getSession, saveTokens } from "./session";

// Includes the /api prefix, e.g. http://localhost:3000/api
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const { accessToken } = getSession();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Access tokens last 15 minutes. On a 401 we trade the refresh token for a new pair and retry the
// request once. Rotation means a refresh token only works once, so concurrent 401s must share one
// refresh call instead of each sending the same token.
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = getSession();
  if (!refreshToken) throw new Error("No refresh token");
  // Plain axios (not `api`) so this call can't trigger the interceptor below.
  const { data } = await axios.post<TokenPair>(`${baseURL}/auth/refresh`, { refreshToken });
  saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/");

    // A 401 from /auth/login means "wrong password", not "session expired".
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      return Promise.reject(error);
    }

    try {
      // If the stored token changed since this request was sent, another request already refreshed:
      // just retry with the current token instead of rotating again.
      const sentWith = original.headers.Authorization;
      const current = getSession().accessToken;
      let accessToken: string;
      if (current && sentWith !== `Bearer ${current}`) {
        accessToken = current;
      } else {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null;
        });
        accessToken = await refreshing;
      }
      original._retried = true;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch {
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  },
);

/** Turns any thrown value into a message that's safe to show to the user. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    if (!err.response) return "Can't reach the server. Is the API running?";
    const { message, issues } = err.response.data ?? {};
    if (issues?.length) return issues.map((i) => `${i.path}: ${i.message}`).join(". ");
    return message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
