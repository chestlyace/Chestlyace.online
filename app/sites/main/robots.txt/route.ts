import { robotsTxt, textResponse } from "@/lib/seo";

export function GET() {
  return textResponse(robotsTxt("main"), "text/plain");
}
