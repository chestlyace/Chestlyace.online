import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/blog/auth";

// Better Auth's endpoints for readers (sign-in with GitHub or Google, the session,
// sign-out, deleting an account). Answers on the blog host only (lib/sites.ts).
export const { GET, POST } = toNextJsHandler((request) =>
  getAuth().handler(request),
);
