import type { AuthResponse, AuthUser } from "@delivery/shared-types";

// Namespaced so customer-web and admin-web never read each other's session.
const PREFIX = "delivery.admin.";
const K = {
  access: PREFIX + "accessToken",
  refresh: PREFIX + "refreshToken",
  user: PREFIX + "user",
};

export function getSession() {
  const user = localStorage.getItem(K.user);
  return {
    accessToken: localStorage.getItem(K.access),
    refreshToken: localStorage.getItem(K.refresh),
    user: user ? (JSON.parse(user) as AuthUser) : null,
  };
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem(K.access, auth.accessToken);
  localStorage.setItem(K.refresh, auth.refreshToken);
  localStorage.setItem(K.user, JSON.stringify(auth.user));
}

/** Refresh tokens rotate: every refresh returns a NEW refresh token that must replace the old one. */
export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(K.access, accessToken);
  localStorage.setItem(K.refresh, refreshToken);
}

export function clearSession() {
  localStorage.removeItem(K.access);
  localStorage.removeItem(K.refresh);
  localStorage.removeItem(K.user);
}
