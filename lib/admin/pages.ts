import { getRow, listRows } from "./api";
import { adminConfig, type AdminRow } from "./config";
import { findResource } from "./resources";
import { getDb } from "@/lib/db";
import { parseId } from "./route";

// What the admin's list and editor pages load.

// Rows go to the browser without their timestamps.
const plain = (row: Record<string, unknown>): AdminRow => {
  const { createdAt, updatedAt, ...rest } = row;
  void createdAt;
  void updatedAt;
  return rest as AdminRow;
};

export async function loadList(id: string) {
  const config = adminConfig(id);
  const resource = findResource(id);
  if (!config || !resource) return null;
  const rows = await listRows(getDb(), resource.api);
  return { config, resource, rows: rows.map(plain) };
}

export async function loadEntry(id: string, rawId: string) {
  const config = adminConfig(id);
  const resource = findResource(id);
  const rowId = parseId(rawId);
  if (!config || !resource || rowId === null) return null;
  const row = await getRow(getDb(), resource.api, rowId);
  return row ? { config, resource, row: plain(row) } : null;
}
