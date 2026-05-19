// Central API client for HeartX — points to Java backend.
// Override at runtime/build by setting VITE_HEARTX_API_BASE.
// export const API_BASE: string =
//   (import.meta.env.VITE_HEARTX_API_BASE as string | undefined) ??
//   "http://localhost:8080";

export const API_BASE: string = "http://localhost:8080/heartx";

const TOKEN_KEY = "heartx.token";

export const tokenStore = {
  get: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set: (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const h = new Headers(headers);
  if (!h.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    h.set("Content-Type", "application/json");
  }
  if (auth) {
    const tok = tokenStore.get();

    console.log("TOKEN IN API FETCH:", tok);

    if (tok && tok !== "null") {
      h.set("Authorization", `Bearer ${tok}`);
    }
  }
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { ...rest, headers: h });
  const ct = res.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    throw new ApiError(
      typeof body === "string" ? body || res.statusText : (body as { message?: string })?.message ?? res.statusText,
      res.status,
      body,
    );
  }
  return body as T;
}
