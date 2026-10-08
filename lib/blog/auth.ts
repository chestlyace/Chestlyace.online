import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, inArray, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getDb, type Database } from "@/lib/db";
import { siteUrl } from "@/lib/sites";

// Reader sign-in (design.md §13.36, D83): GitHub or Google through Better Auth,
// with the readers in our own database and its own cookie, on the blog host only
// (`/api/reader/*`). The owner's admin sign-in is separate (D71): a reader is never
// an admin.

export type ProviderId = "github" | "google";

type Env = Record<string, string | undefined>;

// A provider is offered only when both its keys are set.
export function configuredProviders(env: Env = process.env): ProviderId[] {
  const out: ProviderId[] = [];
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) out.push("github");
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) out.push("google");
  return out;
}

export function createAuth(env: Env = process.env, db: Database = getDb()) {
  return betterAuth({
    baseURL: siteUrl("blog"),
    basePath: "/api/reader",
    // A long random string; sessions are signed with it.
    secret:
      env.BETTER_AUTH_SECRET ||
      "development-only-secret-do-not-use-in-production",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        readerUser: schema.readerUser,
        readerSession: schema.readerSession,
        readerAccount: schema.readerAccount,
        readerVerification: schema.readerVerification,
      },
    }),
    user: {
      modelName: "readerUser",
      additionalFields: {
        banned: { type: "boolean", defaultValue: false, input: false },
        isAuthor: { type: "boolean", defaultValue: false, input: false },
      },
      deleteUser: {
        enabled: true,
        // Their likes on comments go with the account, so the counts must come down;
        // their comments stay, as "Deleted user" (the foreign key sets user_id null).
        beforeDelete: async (user) => {
          const liked = await db
            .select({ id: schema.blogCommentLikes.commentId })
            .from(schema.blogCommentLikes)
            .where(eq(schema.blogCommentLikes.userId, user.id));
          if (liked.length)
            await db
              .update(schema.blogComments)
              .set({
                likeCount: sql`greatest(${schema.blogComments.likeCount} - 1, 0)`,
              })
              .where(
                inArray(
                  schema.blogComments.id,
                  liked.map((row) => row.id),
                ),
              );
        },
      },
    },
    session: { modelName: "readerSession", expiresIn: 60 * 60 * 24 * 30 },
    account: { modelName: "readerAccount" },
    verification: { modelName: "readerVerification" },
    socialProviders: {
      ...(configuredProviders(env).includes("github")
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID!,
              clientSecret: env.GITHUB_CLIENT_SECRET!,
            },
          }
        : {}),
      ...(configuredProviders(env).includes("google")
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID!,
              clientSecret: env.GOOGLE_CLIENT_SECRET!,
            },
          }
        : {}),
    },
    advanced: {
      // Its own cookie, never the admin's.
      cookiePrefix: "reader",
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  });
}

type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { chestlyaceAuth?: Auth };

// One instance per server, made when first needed (so the build doesn't need the
// database or the keys).
export function getAuth(): Auth {
  globalForAuth.chestlyaceAuth ??= createAuth();
  return globalForAuth.chestlyaceAuth;
}

// ---- who is reading ---------------------------------------------------------------

export type Reader = {
  id: string;
  name: string;
  image: string | null;
  banned: boolean;
  isAuthor: boolean;
};

export async function getReader(
  headers: Headers,
  auth: Auth = getAuth(),
): Promise<Reader | null> {
  try {
    const session = await auth.api.getSession({ headers });
    if (!session) return null;
    const user = session.user as typeof session.user & {
      banned?: boolean;
      isAuthor?: boolean;
    };
    return {
      id: user.id,
      name: user.name,
      image: user.image ?? null,
      banned: Boolean(user.banned),
      isAuthor: Boolean(user.isAuthor),
    };
  } catch {
    return null;
  }
}
