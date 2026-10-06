// Prints a bcrypt hash for ADMIN_PASSWORD_HASH (docs/architecture.md §6):
//   pnpm admin:hash            (asks for the password; nothing is shown as you type)
//   pnpm admin:hash "pass"     (the password as an argument, if you must)
// Two lines come out: one to paste into .env.local, where every `$` has to be
// escaped (Next expands `$name` in .env files), and one for Vercel's settings,
// which takes the hash as it is.
import bcrypt from "bcryptjs";
import readline from "node:readline";

async function ask() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.stdoutMuted = false;
  const write = rl._writeToOutput;
  rl._writeToOutput = (text) => {
    if (rl.stdoutMuted) return;
    write.call(rl, text);
  };
  return new Promise((resolve) => {
    rl.question("Password: ", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    rl.stdoutMuted = true;
  });
}

const password = process.argv[2] ?? (await ask());
if (password.length < 12) {
  console.error("Use at least 12 characters.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nFor .env.local (dollar signs escaped):");
console.log(`ADMIN_PASSWORD_HASH=${hash.replaceAll("$", "\\$")}`);
console.log("\nFor Vercel (as it is):");
console.log(hash);
console.log(
  "\nAlso set SESSION_SECRET to a random string of at least 32 characters, e.g.:",
);
console.log(
  "  node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"",
);
