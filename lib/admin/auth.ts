import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { safeNext } from "./request";

// Is there a valid admin session on this request?
export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(
    store.get(SESSION_COOKIE)?.value,
    process.env.SESSION_SECRET,
  );
}

// Every screen after the login sits behind this. Without a session the visitor
// goes to the login and comes back to the screen they asked for (the proxy puts
// the path in `x-admin-path`).
export async function requireSession(): Promise<void> {
  if (await hasSession()) return;
  const path = safeNext((await headers()).get("x-admin-path"));
  redirect(
    path === "/"
      ? "/login?reason=expired"
      : `/login?reason=expired&next=${encodeURIComponent(path)}`,
  );
}
