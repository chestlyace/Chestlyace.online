import Link from "next/link";

// The admin's own 404, inside the shell.
export default function AdminNotFound() {
  return (
    <>
      <h1 className="text-title text-foreground">Page not found</h1>
      <p className="mt-2 mb-6 text-body text-muted">
        There is nothing at this address.
      </p>
      <Link href="/" className="link-inline text-body font-medium">
        Back to the dashboard
      </Link>
    </>
  );
}
