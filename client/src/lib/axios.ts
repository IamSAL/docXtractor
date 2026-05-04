import axios, { AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth-store";

const SERVER_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

export const AXIOS_INSTANCE = axios.create({
  baseURL: SERVER_URL,
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
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

// Single in-flight refresh promise shared across all concurrent 401s
let refreshPromise: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = useAuthStore
      .getState()
      .refreshAccessToken()
      .then(() => useAuthStore.getState().accessToken)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/admin-setup") ||
      originalRequest.url?.includes("/auth/signup") ||
      originalRequest.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const token = await refreshOnce();
        if (!token) throw new Error("No token after refresh");
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return AXIOS_INSTANCE(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        ) {
          window.location.href = "/login";
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
