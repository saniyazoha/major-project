/**
 * Frontend API Client Foundation for SABHA (Lect-AI)
 *
 * Centralized HTTP client using standard fetch API for backend integration.
 */

export const TOKEN_KEY = "access_token";

/**
 * Get configured API base URL from Vite environment.
 * Throws a clear error if VITE_API_BASE_URL is not set.
 */
function getBaseUrl() {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    throw new Error(
      "VITE_API_BASE_URL is not configured. Please set VITE_API_BASE_URL in your environment.",
    );
  }
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Retrieve the stored JWT access token from localStorage.
 */
function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Clear stored JWT access token owned by the API client.
 */
export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // ignore storage access issues
  }
}

/**
 * Core HTTP request handler.
 *
 * @param {string} endpoint - API path (e.g., "/auth/faculty/login" or "health")
 * @param {Object} [options] - Standard fetch options plus optional body object
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const headers = {
    ...options.headers,
  };

  // Attach Authorization header automatically if a token exists and no caller header is provided
  const hasAuthHeader = Object.keys(headers).some(
    (k) => k.toLowerCase() === "authorization",
  );
  const token = getStoredToken();
  if (token && !hasAuthHeader) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    const hasContentType = Object.keys(headers).some(
      (k) => k.toLowerCase() === "content-type",
    );
    if (!hasContentType) {
      headers["Content-Type"] = "application/json";
    }
    body = JSON.stringify(body);
  }

  const config = {
    ...options,
    headers,
    body,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    const error = new Error(
      `Network error connecting to backend at ${url}: ${netErr.message}`,
    );
    error.status = 0;
    error.data = null;
    throw error;
  }

  if (response.status === 401) {
    clearAuthToken();
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
  }

  // 204 No Content handling
  if (response.status === 204) {
    if (!response.ok) {
      const error = new Error(`API request failed with status ${response.status}`);
      error.status = response.status;
      error.data = null;
      throw error;
    }
    return null;
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    if (data && typeof data === "object") {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((err) => err.msg || err).join("; ");
      } else if (typeof data.message === "string") {
        message = data.message;
      }
    } else if (typeof data === "string" && data.trim()) {
      message = data;
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiClient = {
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
