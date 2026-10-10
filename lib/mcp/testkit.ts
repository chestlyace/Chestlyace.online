import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { resetLimits } from "./limits";
import { createMcpServer } from "./server";
import { allTools } from "./tools";
import type { Caller } from "./tool";

// Shared by the tool tests: a migrated in-memory database, and a client connected to a
// server for a token with the given scopes.

export async function testDb(): Promise<Database> {
  const instance = drizzle(new PGlite(), { schema });
  await migrate(instance, { migrationsFolder: "db/migrations" });
  return instance;
}

export async function connectAs(db: Database, scopes: string[]) {
  const [row] = await db
    .insert(schema.agentTokens)
    .values({
      name: "Test agent",
      tokenHash: `h${Math.random()}`,
      prefix: "cmcp_xx",
      scopes,
    })
    .returning();
  const caller: Caller = { id: row.id, name: "Test agent", scopes };
  resetLimits(row.id);
  const server = createMcpServer(db, caller, allTools());
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test", version: "1" });
  await client.connect(clientSide);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = (await client.callTool({ name, arguments: args })) as {
      isError?: boolean;
      content: { text: string }[];
    };
    const text = result.content[0].text;
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests read the JSON freely
    return { error: result.isError === true, text, data: data as any };
  };
  return { client, caller, call };
}
