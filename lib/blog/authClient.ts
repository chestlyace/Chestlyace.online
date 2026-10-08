"use client";

import { createAuthClient } from "better-auth/react";

// Better Auth in the browser: sign in with a provider, sign out, delete the account.
// Talks to the blog host's own `/api/reader` (same origin), nothing else.
export const authClient = createAuthClient({ basePath: "/api/reader" });
