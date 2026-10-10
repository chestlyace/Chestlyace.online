import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The MCP endpoint serves the blog's markdown guide from `docs/` (docs/mcp.md §5).
  outputFileTracingIncludes: {
    "/sites/admin/mcp": ["./docs/blog-markdown.md"],
  },
};

export default nextConfig;
