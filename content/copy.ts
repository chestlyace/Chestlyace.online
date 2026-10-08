import type { PublicSiteKey } from "@/lib/sites";

// PLACEHOLDER COPY — every string in this file is a stand-in written by the
// agent, not the owner's wording (design.md §13–14 mark each one). Replace them
// here; nothing else needs to change. Search for "PLACEHOLDER" to find the
// groups.

// PLACEHOLDER — one line under each site in the Sites menu (design.md §13.7).
export const SITE_MENU_DESCRIPTIONS: Record<PublicSiteKey, string> = {
  main: "Software engineering",
  creatives: "Design and photography",
  blog: "Writing and notes",
};

// PLACEHOLDER — the one-line description in the footer's brand block
// (design.md §13.8, D26).
export const FOOTER_DESCRIPTIONS: Record<PublicSiteKey, string> = {
  main: "Software engineer building fast, reliable products for the web.",
  creatives: "Design and photography by Chestly Ace.",
  blog: "Writing and notes from Chestly Ace.",
};

// PLACEHOLDER — the hero's tagline under the headline (design.md §14.1). The old
// one named design and photography; this is software only.
export const HERO_TAGLINE =
  "Software engineer crafting modern digital experiences.";

// PLACEHOLDER — the hero's paragraph. The names come from the profile.
export function heroIntro(name: string, legalName: string | null): string {
  const who =
    legalName && legalName !== name
      ? `${legalName}, known professionally as ${name},`
      : name;
  return `${who} builds fast, reliable websites and web applications.`;
}

// PLACEHOLDER — the speech-bubble quote card next to the portrait. The old text
// was "Chill and relax, it's the weekend. Not you devs & designers, go complete
// your client's projects."; "& designers" is dropped (software only).
export const HERO_QUOTE = {
  handle: "@Dev.Ace",
  text: "Chill and relax, it's the weekend. Not you devs, go complete your client's projects.",
};

// PLACEHOLDER — the intro under the Services heading (from ia-content.md §2.4).
export const SERVICES_INTRO =
  "I help businesses, founders, and teams launch responsive websites and custom web applications, with attention to performance, maintainable code, and clean delivery.";

// PLACEHOLDER — the Creatives card that ends the service stack (design.md §13.12).
export const CREATIVES_CARD = {
  label: "Creatives",
  title: "Design & photography live on Creatives",
  line: "Looking for design or photography? See my creative work.",
};

// PLACEHOLDER — the intro under the Volunteering heading (design.md §14.7).
export const VOLUNTEERING_INTRO =
  "Time given to communities and causes outside of paid work.";

// PLACEHOLDER — the Contact section (design.md §14.8). The heading carries over
// from the old site; the intro drops "design, or photography".
export const CONTACT_HEADING = "Let's work together";
// PLACEHOLDER — the title at the top of the form card.
export const CONTACT_FORM_TITLE = "Send a message";
export const CONTACT_INTRO =
  "Have a project in mind? Let's create something extraordinary.";

// PLACEHOLDER — the form's thank-you panel and its error messages
// (design.md §13.15).
export const CONTACT_SUCCESS = {
  title: "Message sent",
  text: "Thanks for reaching out. I'll reply by email as soon as I can.",
  whatsapp: "Continue on WhatsApp",
};
export const CONTACT_ERRORS = {
  failed:
    "Your message didn't go through. Please try again, or use the email or WhatsApp links.",
  rateLimited:
    "You've sent a few messages already. Please try again a little later, or use the email or WhatsApp links.",
};

// PLACEHOLDER — the coming-soon page on the creatives and blog hosts until
// Phases 9–10 build them (design.md §14.12). The creatives lead keeps both name
// forms (ia-content.md §4).
export const COMING_SOON_LABEL = "Coming soon";
export const COMING_SOON_BUTTON = "Visit chestlyace.online";
export const COMING_SOON: Record<
  Exclude<PublicSiteKey, "main">,
  { title: string; lead: string }
> = {
  creatives: {
    title: "Design & Photography",
    lead: "Graphic design, branding, and photography by Chestly Ace (Amahndong Chestly). A new home for the work is on its way.",
  },
  blog: {
    title: "Blog",
    lead: "Writing on software engineering, web development, and building things. The first posts are on their way.",
  },
};

// The newsletter's wording as first written. The owner edits it in the admin
// (Blog → Newsletter); these are what a field shows until it is changed, and what
// a blank or missing one falls back to (lib/newsletterCopy.ts).

// PLACEHOLDER — the blog's newsletter box (design.md §13.34), approved with the
// Phase 9a spec.
export const NEWSLETTER = {
  label: "Newsletter",
  title: "New posts, in your inbox",
  text: "A short email when I publish something new. Nothing else.",
  helper:
    "You can unsubscribe at any time. Prefer a feed? Use the RSS link in the footer.",
  success: "Check your inbox. I've sent you a link to confirm your address.",
  error: "That didn't work. Please try again in a moment.",
  invalid: "Enter a valid email address.",
  rateLimited: "Too many tries from here. Please try again a little later.",
};

// PLACEHOLDER — the page the confirmation link lands on (design.md §14.16),
// approved with the Phase 9a spec.
export const NEWSLETTER_CONFIRMED = {
  label: "Subscribed",
  title: "You're on the list",
  lead: "Thanks for confirming. You'll get an email when there's a new post.",
  button: "Read the blog",
};
export const NEWSLETTER_FAILED = {
  label: "Link expired",
  title: "That link didn't work",
  lead: "It may have expired or already been used. You can subscribe again from the bottom of any post.",
  button: "Go to the blog",
};

// DRAFT — the confirmation email (9b.7), for the owner's approval. Not part of
// the approved spec, which covers the box and the page only.
export const NEWSLETTER_EMAIL = {
  subject: "Confirm your subscription to the Chestly Ace blog",
  intro: "Thanks for subscribing to new posts from the Chestly Ace blog.",
  action: "Confirm my subscription",
  expires: "This link works for 48 hours.",
  ignore:
    "If you didn't ask for this, just ignore this email. Nobody is subscribed until the link is opened.",
};

// PLACEHOLDER — the creatives site's wording (design.md §14.20–14.26). The owner
// edits all of it in the admin (Creatives → Settings); these are what a field shows
// until it is changed, and what a blank one falls back to (lib/creativesCopy.ts).
export const CREATIVES = {
  heroStatement: "Design & Photography",
  heroLine:
    "Brand visuals and event stories by Chestly Ace (Amahndong Chestly).",
  designIntro:
    "Logos, posters, social campaigns and brand visuals made to look intentional.",
  photographyIntro:
    "Events, portraits and brand stories, from the moments worth keeping.",
  portalsTitle: "Two ways I work",
  portalDesignText: "Brand identity, posters and campaign visuals.",
  portalPhotographyText: "Events and portraits, told in pictures.",
  marqueeWords: ["Graphic design", "Photography", "Branding", "Events"],
  contactStatement: "Have a project or an event to cover?",
  contactText:
    "Tell me what you have in mind and I'll get back to you with ideas and a quote.",
  contactNote: "I usually reply within a day.",
  seoDescription:
    "Graphic design, branding, and photography by Chestly Ace (Amahndong Chestly).",
};
