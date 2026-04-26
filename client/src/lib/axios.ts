import axios, { AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth-store";
import { cookieStorage } from "./cookie-storage";

const SERVER_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

export const AXIOS_INSTANCE = axios.create({
  baseURL: SERVER_URL,
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  // If we are refreshing the token, attach the refresh token
  if (config.url?.includes("/auth/refresh")) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      config.headers.Authorization = `Bearer ${refreshToken}`;
    }
    return config;
  }

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (Unauthorized) — skip auth endpoints so login/setup
    // failures return the real server error instead of "No refresh token available"
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/admin-setup") ||
      originalRequest.url?.includes("/auth/signup");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the access token
        await useAuthStore.getState().refreshAccessToken();
        const newToken = useAuthStore.getState().accessToken;

        if (newToken) {
          // Update the authorization header with the new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Retry the original request
          return AXIOS_INSTANCE(originalRequest);
        }
      } catch (refreshError: any) {
        // Only logout if refresh token is also invalid
        // This prevents logout on network errors
        if (
          refreshError?.response?.status === 401 ||
          refreshError?.response?.status === 403
        ) {
          console.error("Refresh token expired or invalid. Logging out...");

          // Final check: did another tab refresh it while we were trying?
          const storedValue = cookieStorage.getItem("auth-storage");
          const resolvedValue =
            storedValue instanceof Promise ? await storedValue : storedValue;
          if (resolvedValue) {
            try {
              const parsed = JSON.parse(resolvedValue);
              if (
                parsed.state?.accessToken &&
                parsed.state.accessToken !== useAuthStore.getState().accessToken
              ) {
                // Yes! Someone else fixed it. Don't logout.
                originalRequest.headers.Authorization = `Bearer ${parsed.state.accessToken}`;
                return AXIOS_INSTANCE(originalRequest);
              }
            } catch (e) {}
          }

          // logout() already clears query cache and disconnects socket
          useAuthStore.getState().logout();

          // Redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        } else {
          console.error(
            "Token refresh failed due to network or server error:",
            refreshError,
          );
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// fallow-ignore-next-line unused-exports
export const HttpClient = <T>(
  url: string,
  options: RequestInit & { params?: any; responseType?: any } = {},
): Promise<T> => {
  const { body, ...rest } = options;

  const config: AxiosRequestConfig = {
    url,
    data: body,
    ...rest,
    headers: rest.headers as any,
    signal: rest.signal || undefined,
  };

  return AXIOS_INSTANCE(config).then((res) => ({
    data: res.data,
    status: res.status,
    headers: res.headers,
  })) as Promise<T>;
};
