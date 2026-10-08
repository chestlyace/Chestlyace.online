import { createHmac } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { configuredProviders, createAuth, getReader } from "./auth";

const SECRET = "a-long-enough-secret-for-testing-0123456789";
let db: Database;
let auth: ReturnType<typeof createAuth>;

beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  auth = createAuth(
    {
      BETTER_AUTH_SECRET: SECRET,
      GITHUB_CLIENT_ID: "x",
      GITHUB_CLIENT_SECRET: "y",
    },
    db,
  );
}, 30_000);

// A session cookie as Better Auth signs it, standing in for a finished OAuth sign-in.
async function signedIn(over: { name?: string; email?: string } = {}) {
  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser(
    {
      name: over.name ?? "Ada",
      email: over.email ?? "ada@example.com",
      emailVerified: true,
      image: "https://example.com/ada.png",
    },
    { method: "oauth", oauth: { providerId: "github" } },
  );
  const session = await ctx.internalAdapter.createSession(user.id, false);
  const signature = createHmac("sha256", SECRET)
    .update(session.token)
    .digest("base64");
  const name = ctx.authCookies.sessionToken.name;
  return {
    user,
    headers: new Headers({
      cookie: `${name}=${encodeURIComponent(`${session.token}.${signature}`)}`,
    }),
  };
}

describe("configuredProviders", () => {
  it("offers a provider only when both its keys are set", () => {
    expect(configuredProviders({})).toEqual([]);
    expect(configuredProviders({ GITHUB_CLIENT_ID: "a" })).toEqual([]);
    expect(
      configuredProviders({
        GITHUB_CLIENT_ID: "a",
        GITHUB_CLIENT_SECRET: "b",
        GOOGLE_CLIENT_ID: "c",
        GOOGLE_CLIENT_SECRET: "d",
      }),
    ).toEqual(["github", "google"]);
  });
});

describe("readers", () => {
  it("uses its own tables and cookie, and reads the session into a reader", async () => {
    const { user, headers } = await signedIn();
    expect((await auth.$context).authCookies.sessionToken.name).toMatch(
      /^reader/,
    );
    expect(await getReader(headers, auth)).toEqual({
      id: user.id,
      name: "Ada",
      image: "https://example.com/ada.png",
      banned: false,
      isAuthor: false,
    });
    const [row] = await db.select().from(schema.readerUser);
    expect(row).toMatchObject({
      email: "ada@example.com",
      banned: false,
      isAuthor: false,
    });
    expect(await db.select().from(schema.readerSession)).toHaveLength(1);
  });

  it("knows no one without a session, with a forged cookie, or after sign-out of the row", async () => {
    expect(await getReader(new Headers(), auth)).toBeNull();
    const { headers } = await signedIn();
    const cookie = headers.get("cookie")!;
    expect(
      await getReader(new Headers({ cookie: cookie.replace(/.$/, "x") }), auth),
    ).toBeNull();
    await db.delete(schema.readerSession);
    expect(await getReader(headers, auth)).toBeNull();
  });

  it("reports a banned reader and the author's account", async () => {
    const { user, headers } = await signedIn();
    await db
      .update(schema.readerUser)
      .set({ banned: true, isAuthor: true })
      .where(eq(schema.readerUser.id, user.id));
    expect(await getReader(headers, auth)).toMatchObject({
      banned: true,
      isAuthor: true,
    });
  });
});
