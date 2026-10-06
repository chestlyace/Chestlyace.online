// Copies Devicon's SVGs into public/devicon/ so the Skills section can show any
// icon slug stored in the database (skills.icon_slug) without a code change.
// Generated, not committed (see .gitignore); runs before `dev` and `build`.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const root = dirname(require.resolve("devicon/package.json"));
const { version } = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);
const target = join(process.cwd(), "public", "devicon");
const marker = join(target, ".version");

if (existsSync(marker) && readFileSync(marker, "utf8").trim() === version) {
  process.exit(0); // already up to date
}

mkdirSync(target, { recursive: true });
let copied = 0;
for (const slug of readdirSync(join(root, "icons"))) {
  for (const file of readdirSync(join(root, "icons", slug))) {
    if (!file.endsWith(".svg")) continue;
    copyFileSync(join(root, "icons", slug, file), join(target, file));
    copied++;
  }
}
writeFileSync(marker, `${version}\n`);
console.log(`devicon ${version}: copied ${copied} icons to public/devicon/`);
