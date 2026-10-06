import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Migrations prefer the direct (unpooled) connection when one is provided.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url: url ?? "" },
  strict: true,
  verbose: true,
});
