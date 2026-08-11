const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:3000/api";

let accessToken = localStorage.getItem("mflow_token");
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("mflow_token", token);
  else localStorage.removeItem("mflow_token");
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData) && !headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API. Verifique se o servidor está iniciado.",
      0,
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      unauthorizedHandler?.();
    }
    const rawMessage = payload?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(" ")
      : rawMessage || "Não foi possível concluir a solicitação.";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export function queryString(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(
    ([key, value]) => value && params.set(key, value),
  );
  const result = params.toString();
  return result ? `?${result}` : "";
}
