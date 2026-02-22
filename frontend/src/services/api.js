const API_BASE =
  window.api || import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const errorMessage =
      typeof data === "string" && data.trim()
        ? data
        : data?.message || data?.error || "Request failed";
    const error = new Error(errorMessage);
    error.data = data;
    throw error;
  }
  return data;
}

export function getApiBase() {
  return API_BASE;
}
