// The wording of the blog's newsletter and of the creatives site as first written. The
// owner edits both in the admin (Blog → Newsletter, Creatives → Settings); these are
// what a field shows until it is changed, and what a blank or missing one falls back
// to (lib/newsletterCopy.ts, lib/creativesCopy.ts). Everything else a visitor reads
// that is written in code is in `content/messages` (docs/i18n.md §4); these two move
// there, with their French, in Phase 11b.4 and 11b.5.
//
// PLACEHOLDER COPY — the wording here was written by the agent, not the owner
// (design.md §13–14 mark each one).

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
