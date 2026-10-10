import type { AnyTool } from "../tool";
import { blogTools } from "./blog";
import { portfolioTools } from "./portfolio";
import { generalTools } from "./general";
import { mediaTools } from "./media";

// Every tool the server knows (docs/mcp.md §5). Each step of Phase 13 adds its group here;
// the server lists a tool only to a token whose scopes allow it.
export function allTools(): AnyTool[] {
  return [...generalTools, ...mediaTools, ...blogTools, ...portfolioTools];
}
