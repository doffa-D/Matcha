import axios from "redaxios";

const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

type Method = "get" | "post" | "put" | "patch" | "delete";

interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// Build URL with query parameters
const buildUrl = (url: string, params?: Record<string, any>): string => {
  if (!params) return `${baseURL}${url}`;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    // Only add params that have defined, non-null values
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseURL}${url}?${queryString}` : `${baseURL}${url}`;
};

const request = async <T>(
  method: Method,
  url: string,
  data?: any,
  options?: RequestOptions,
) => {
  const token = getToken();
  const fullUrl =
    method === "get" ? buildUrl(url, options?.params) : `${baseURL}${url}`;

  // Don't set Content-Type for FormData - browser sets it automatically with boundary
  const isFormData = data instanceof FormData;

  const response = await axios({
    method,
    url: fullUrl,
    data,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  return response as { data: T };
};

const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>("get", url, undefined, options),
  post: <T>(url: string, data?: any, options?: RequestOptions) =>
    request<T>("post", url, data, options),
  put: <T>(url: string, data?: any, options?: RequestOptions) =>
    request<T>("put", url, data, options),
  patch: <T>(url: string, data?: any, options?: RequestOptions) =>
    request<T>("patch", url, data, options),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>("delete", url, undefined, options),
};

export default api;
