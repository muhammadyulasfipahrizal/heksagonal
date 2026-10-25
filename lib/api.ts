
import config from "./config";

const apiClient = {
  baseUrl: config.apiBaseUrl,

  async request(endpoint: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    const isFormData = options.body instanceof FormData;

    if (isFormData) {
      // Let the browser set multipart/form-data and its boundary.
      headers.delete("Content-Type");
    } else if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: "include",
      headers,
    });
  },

  get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  },

  post(endpoint: string, data?: unknown, options?: RequestInit) {
    const body =
      data instanceof FormData
        ? data
        : data !== undefined
          ? JSON.stringify(data)
          : undefined;

    return this.request(endpoint, {
    ...options,
      method: "POST",
      body,
    });
  },

  put(endpoint: string, data?: unknown, options?: RequestInit) {
    const body =
      data instanceof FormData
        ? data
        : data !== undefined
          ? JSON.stringify(data)
          : undefined;

    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body,
    });
  },

  delete(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  },
};

export default apiClient;
export { apiClient };
