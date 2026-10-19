import config from "./config";

const apiClient = {
  baseUrl: config.apiBaseUrl,

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return response;
  },

  get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  },

  post(endpoint: string, data?: unknown, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },

  put(endpoint: string, data?: unknown, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
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