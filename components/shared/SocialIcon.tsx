import { Link as LinkIcon } from "lucide-react";
import { siGithub, siInstagram, siTiktok, siWhatsapp } from "simple-icons";

type IconData = { path: string; viewBox: string };

// Brand logos (design.md §6): Simple Icons, except LinkedIn — Simple Icons
// dropped it — which uses Devicon's `linkedin-plain` (MIT) path.
const ICONS: Record<string, IconData> = {
  instagram: { path: siInstagram.path, viewBox: "0 0 24 24" },
  github: { path: siGithub.path, viewBox: "0 0 24 24" },
  tiktok: { path: siTiktok.path, viewBox: "0 0 24 24" },
  whatsapp: { path: siWhatsapp.path, viewBox: "0 0 24 24" },
  linkedin: {
    path: "M116 3H12a8.91 8.91 0 00-9 8.8v104.42a8.91 8.91 0 009 8.78h104a8.93 8.93 0 009-8.81V11.77A8.93 8.93 0 00116 3zM39.17 107H21.06V48.73h18.11zm-9-66.21a10.5 10.5 0 1110.49-10.5 10.5 10.5 0 01-10.54 10.48zM107 107H88.89V78.65c0-6.75-.12-15.44-9.41-15.44s-10.87 7.36-10.87 15V107H50.53V48.73h17.36v8h.24c2.42-4.58 8.32-9.41 17.13-9.41C103.6 47.28 107 59.35 107 75z",
    viewBox: "0 0 128 128",
  },
};

// `name` is socials.icon from the database ("github", "linkedin", …). An
// unknown name shows a plain link icon.
export function SocialIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const icon = Object.hasOwn(ICONS, name.toLowerCase())
    ? ICONS[name.toLowerCase()]
    : null;
  if (!icon) return <LinkIcon className={className} aria-hidden="true" />;
  return (
    <svg
      viewBox={icon.viewBox}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={icon.path} />
    </svg>
  );
}
