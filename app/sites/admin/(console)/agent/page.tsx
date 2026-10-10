import type { Metadata } from "next";
import { AgentAccess } from "@/components/admin/agent/AgentAccess";
import { serverNow } from "@/lib/admin/time";
import { getDb } from "@/lib/db";
import { listTokens } from "@/lib/mcp/tokens";
import { siteUrl } from "@/lib/sites";

export const metadata: Metadata = { title: "Agent access" };

// Always read fresh: the list shows what the endpoint accepts right now.
export const dynamic = "force-dynamic";

// Settings → Agent access (docs/mcp.md §7): the tokens an AI agent uses to work in this
// admin through the MCP endpoint.
export default async function AgentAccessPage() {
  const tokens = await listTokens(getDb());
  return (
    <>
      <h1 className="text-title text-foreground">Agent access</h1>
      <p className="mt-2 mb-8 max-w-[60ch] text-body text-muted">
        Let an AI agent write posts, upload pictures and edit content here,
        through MCP. Each token has its own scopes and can be revoked. Every
        call is in{" "}
        <a href="/agent/activity" className="link-inline">
          Activity
        </a>
        .
      </p>
      <AgentAccess
        tokens={tokens}
        endpoint={siteUrl("admin", "/mcp")}
        now={serverNow().getTime()}
      />
    </>
  );
}
