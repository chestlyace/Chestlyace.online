import bcrypt from "bcryptjs";

// Q15: one admin, a bcrypt hash in ADMIN_PASSWORD_HASH, never the password.
// Anything wrong with the hash (missing, mangled by .env escaping) is "no".
export async function verifyPassword(
  password: string,
  hash: string | undefined,
): Promise<boolean> {
  if (!hash || !/^\$2[aby]\$\d{2}\$.{53}$/.test(hash)) return false;
  if (password.length === 0 || password.length > 200) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
