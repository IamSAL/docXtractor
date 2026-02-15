import { StateStorage } from "zustand/middleware";

export const cookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const result = parts.pop()?.split(";").shift();
      return result ? decodeURIComponent(result) : null;
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    // Set cookie with 7 days expiration (matching refresh token)
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isSecure = window.location.protocol === "https:";
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  },
  removeItem: (name: string): void => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};
