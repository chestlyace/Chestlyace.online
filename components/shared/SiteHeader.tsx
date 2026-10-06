import {
  PUBLIC_SITE_KEYS,
  SITE_LABELS,
  siteUrl,
  type PublicSiteKey,
} from "@/lib/sites";
import { MAIN_NAV } from "@/lib/sections";
import { SITE_MENU_DESCRIPTIONS } from "@/content/copy";
import { HeaderBar, type HeaderSite } from "./HeaderBar";

// Floating capsule header (design.md §13.6). Main has its key links; the
// creatives and blog links are decided in their own design steps.
export function SiteHeader({ site }: { site: PublicSiteKey }) {
  const sites: HeaderSite[] = PUBLIC_SITE_KEYS.map((key) => ({
    key,
    label: SITE_LABELS[key],
    description: SITE_MENU_DESCRIPTIONS[key],
    href: key === site ? "/" : siteUrl(key),
    current: key === site,
  }));

  return <HeaderBar links={site === "main" ? MAIN_NAV : []} sites={sites} />;
}
