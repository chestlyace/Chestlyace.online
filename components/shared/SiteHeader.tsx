import { getMessages } from "@/content/messages";
import { localizedPath, type Lang } from "@/lib/i18n";
import { PUBLIC_SITE_KEYS, siteUrl, type PublicSiteKey } from "@/lib/sites";
import { BLOG_NAV } from "@/lib/blog/nav";
import { CREATIVES_NAV } from "@/lib/creatives/nav";
import { MAIN_NAV, type NavLink } from "@/lib/sections";
import { HeaderBar, type HeaderSite } from "./HeaderBar";

// Floating capsule header (design.md §13.6). Each site has its own key links.
export function SiteHeader({
  site,
  lang,
}: {
  site: PublicSiteKey;
  lang: Lang;
}) {
  const m = getMessages(lang).chrome;
  const sites: HeaderSite[] = PUBLIC_SITE_KEYS.map((key) => ({
    key,
    label: m.siteNames[key],
    description: m.siteDescriptions[key],
    // Another site opens in the same language.
    href:
      key === site
        ? localizedPath("/", lang)
        : siteUrl(key, localizedPath("/", lang)),
    current: key === site,
  }));

  // The main site's and the blog's links are translated here; Creatives' follow with
  // their own step (docs/i18n.md §11).
  const translate = (nav: readonly NavLink[]): NavLink[] =>
    nav.map((link) => ({
      ...link,
      label: m.nav[link.id as keyof typeof m.nav] ?? link.label,
    }));
  const links: readonly NavLink[] =
    site === "main"
      ? translate(MAIN_NAV)
      : site === "blog"
        ? translate(BLOG_NAV)
        : site === "creatives"
          ? CREATIVES_NAV
          : [];

  return (
    <HeaderBar
      links={links}
      activeBy={
        site === "blog"
          ? "blog"
          : site === "creatives"
            ? "creatives"
            : "section"
      }
      sites={sites}
      labels={{
        brandHome: m.brandHome,
        menuOpen: m.menuOpen,
        menuClose: m.menuClose,
        mainNav: m.mainNav,
        menuNav: m.menuNav,
        sites: m.sites,
        youAreHere: m.youAreHere,
        theme: m.theme,
      }}
    />
  );
}
