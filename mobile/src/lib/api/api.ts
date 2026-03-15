import { fetch } from "expo/fetch";
import { authClient } from "../auth/auth-client";

// Use native fetch for FormData uploads due to expo/fetch bug
// https://github.com/expo/expo/issues/33134
const nativeFetch = global.fetch;

// Response envelope type - all app routes return { data: T }
interface ApiResponse<T> {
  data: T;
}

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

interface ApiError {
  error: { message: string; code?: string };
}

const request = async <T>(
  url: string,
  options: { method?: string; body?: string } = {}
): Promise<T> => {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Cookie: authClient.getCookie(),
    },
  });

  // 1. Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  // 2. JSON responses: parse and unwrap { data } or throw on error
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const json = await response.json();

    // Handle error responses (4xx, 5xx)
    if (!response.ok) {
      const errorMsg = (json as ApiError)?.error?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    // Return data or null (never undefined - React Query doesn't like undefined)
    return (json as ApiResponse<T>).data ?? (null as T);
  }

  // 3. Non-JSON error responses
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  // 4. Non-JSON success: return null
  return null as T;
};

const uploadFormData = async <T>(
  url: string,
  formData: FormData
): Promise<T> => {
  // Use native fetch instead of expo/fetch due to FormData bug
  const response = await nativeFetch(`${baseUrl}${url}`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      Cookie: authClient.getCookie(),
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const json = await response.json();

    // Handle error responses
    if (!response.ok) {
      const errorMsg = (json as ApiError)?.error?.message || `Upload failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return (json as ApiResponse<T>).data ?? (null as T);
  }

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  return null as T;
};

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: any) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  patch: <T>(url: string, body: any) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  upload: <T>(url: string, formData: FormData) =>
    uploadFormData<T>(url, formData),
};
