const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

async function request(path, { method = "GET", body, full = false } = {}) {
  const isForm = body instanceof FormData;

  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message ?? "Something went wrong");
    error.status = response.status;
    error.code = payload.errorCode;
    error.details = payload.details;
    throw error;
  }

  /* `full` returns the whole envelope (needed for `pagination`); every
     other caller gets just the payload's `data`, which is what every page
     was built to expect — a plain array or object, never wrapped. */
  return full ? payload : payload.data;
}

export const get = (path) => request(path);
export const post = (path, body) => request(path, { method: "POST", body });
export const patch = (path, body) => request(path, { method: "PATCH", body });
export const del = (path) => request(path, { method: "DELETE" });

/** For list endpoints where the caller actually wants the pagination
 *  metadata too — e.g. a "load more" or page-number control.
 *  Returns { data, pagination }. Most callers should use `get` instead. */
export const getPaginated = async (path) => {
  const payload = await request(path, { full: true });
  return { data: payload.data, pagination: payload.pagination };
};

/** Builds a query string from an object, skipping empty values and "all". */
export const qs = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  const string = search.toString();
  return string ? `?${string}` : "";
};