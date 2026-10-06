// The admin disallows everything (D71).
export function GET() {
  return new Response("User-agent: *\nDisallow: /\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
