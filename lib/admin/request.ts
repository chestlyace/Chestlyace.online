// Small checks shared by the admin's route handlers.

// A path on the admin host to go to after signing in: it must start with one
// slash and nothing that could lead to another site.
export function safeNext(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/";
  if (value === "/login" || value.startsWith("/login?")) return "/";
  return value;
}

// A browser sending a request from another site names it in `Origin`. Requests
// that don't send one (curl, same-origin GETs) pass; the cookie's SameSite=Lax
// and the JSON-only bodies cover the rest.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return (
      new URL(origin).host === new URL(request.url).host ||
      new URL(origin).host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
