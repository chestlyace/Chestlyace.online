import type { HomepageData } from "@/lib/db";
import { isHttpUrl, resumeHref } from "@/lib/links";

// A link in a footer column (design.md §13.8).
export type FooterLink = { label: string; href: string; external?: boolean };

// The footer's Connect and Contact columns, built from the profile and the
// socials shown on the main site. Anything missing is simply left out.
export function footerLinks(
  data: Pick<HomepageData, "profile" | "socials">,
  labels: { whatsapp: string; resume: string } = {
    whatsapp: "WhatsApp",
    resume: "Resume",
  },
): {
  connect: FooterLink[];
  contact: FooterLink[];
} {
  const { profile, socials } = data;

  const connect = socials
    .filter((social) => isHttpUrl(social.url))
    .map((social) => ({
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
        label: labels.whatsapp,
        href: `https://wa.me/${digits}`,
        external: true,
      });
    }

    if (profile.resumeUrl) {
      const { href, external } = resumeHref(profile.resumeUrl);
      contact.push({ label: labels.resume, href, external });
    }
  }

  return { connect, contact };
}
