// The newsletter's checks that run in the browser and on the server (design.md
// §13.34): the address, and what the box sends. Pure; the signing, the email and
// Resend are in newsletterServer.ts.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const EMAIL_MAX = 200;

/** The address, trimmed and lower-cased, or null when it isn't one. */
export function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= EMAIL_MAX && EMAIL.test(email) ? email : null;
}
