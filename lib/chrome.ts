import type { HomepageData } from "@/lib/db";

// A link in a footer column (design.md §13.8).
export type FooterLink = { label: string; href: string; external?: boolean };

const ABSOLUTE_URL = /^https?:\/\//i;

// profile.resume_url is either a full URL (Cloudinary) or a file name from the
// old site ("resume.pdf"), which is served from the site root.
function resumeHref(resumeUrl: string): { href: string; external: boolean } {
  if (ABSOLUTE_URL.test(resumeUrl)) return { href: resumeUrl, external: true };
  return { href: `/${resumeUrl.replace(/^\/+/, "")}`, external: false };
}

// The footer's Connect and Contact columns, built from the profile and the
// socials shown on the main site. Anything missing is simply left out.
export function footerLinks(data: Pick<HomepageData, "profile" | "socials">): {
  connect: FooterLink[];
  contact: FooterLink[];
} {
  const { profile, socials } = data;

  const connect = socials.map((social) => ({
    label: social.platform,
    href: social.url,
    external: true,
  }));

  const contact: FooterLink[] = [];
  if (profile) {
    contact.push({ label: profile.email, href: `mailto:${profile.email}` });

    const digits = profile.whatsappNumber?.replace(/\D/g, "");
    if (digits) {
      contact.push({
        label: "WhatsApp",
        href: `https://wa.me/${digits}`,
        external: true,
      });
    }

    if (profile.resumeUrl) {
      const { href, external } = resumeHref(profile.resumeUrl);
      contact.push({ label: "Resume", href, external });
    }
  }

  return { connect, contact };
}
