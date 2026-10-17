import apiClient from "@/lib/api";

export const addressApi = {
  async request(endpoint: string, options: RequestInit = {}) {
    const response = await apiClient.request(
      `/api/addresses${endpoint === "/" ? "" : endpoint}`,
      options
    );

    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data
          ? String(data.error)
          : `Request failed with status ${response.status}`;

      throw Object.assign(new Error(message), {
        status: response.status,
        data,
      });
    }

    return data;
  },

  // GET /api/addresses/:userId
  get: (userId: string, options?: RequestInit) =>
    addressApi.request(`/${encodeURIComponent(userId)}`, {
      ...options,
      method: "GET",
    }),

  // POST /api/addresses
  post: (
    data: Record<string, unknown>,
    options?: RequestInit
  ) =>
    addressApi.request("/", {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT /api/addresses/:id
  put: (
    id: string,
    data: Record<string, unknown>,
    options?: RequestInit
  ) =>
    addressApi.request(`/${encodeURIComponent(id)}`, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // DELETE /api/addresses/:id
  delete: (
    id: string,
    userId: string,
    options?: RequestInit
  ) =>
    addressApi.request(`/${encodeURIComponent(id)}`, {
      ...options,
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),
};

export default addressApi;