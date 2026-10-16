
const ADDRESS_API_BASE_URL = "/api/addresses";

export const addressApi = {
  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(
      `${ADDRESS_API_BASE_URL}${endpoint}`,
      {
        ...options,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      }
    );

    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw Object.assign(
        new Error(
          typeof data === "object" && data?.error
            ? data.error
            : `Request failed with status ${response.status}`
        ),
        {
          status: response.status,
          data,
        }
      );
    }

    return data;
  },

  get: (endpoint = "/", options?: RequestInit) =>
    addressApi.request(endpoint, { ...options, method: "GET" }),

  post: (endpoint = "/", data?: unknown, options?: RequestInit) =>
    addressApi.request(endpoint, {
      ...options,
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),

  put: (endpoint: string, data?: unknown, options?: RequestInit) =>
    addressApi.request(endpoint, {
      ...options,
      method: "PUT",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    addressApi.request(endpoint, { ...options, method: "DELETE" }),
};

export default addressApi;
