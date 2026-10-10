// Main-site schema — docs/content-schema.md §1.
// Every table has created_at/updated_at; a trigger (see migrations) keeps
// updated_at current on every UPDATE.
import { sql } from "drizzle-orm";
import type { SessionTurn } from "@/lib/blog/session/types";
import type { Translations } from "@/lib/i18n/localize";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

// The French version of a row's text (docs/i18n.md §5): `{ "fr": { "<field>": value } }`.
// The fields that may appear are listed in lib/i18n/translatable.ts.
const translationsColumn = {
  translations: jsonb("translations")
    .$type<Translations>()
    .notNull()
    .default(sql`'{}'::jsonb`),
};

const ordering = {
  orderIndex: integer("order_index").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
};

const emptyTextArray = sql`'{}'::text[]`;

export const profile = pgTable(
  "profile",
  {
    id: integer("id").primaryKey().default(1),
    name: text("name").notNull(),
    legalName: text("legal_name"),
    displayName: text("display_name"),
    headline: text("headline").notNull(),
    tagline: text("tagline"),
    availability: text("availability"),
    heroImageUrl: text("hero_image_url"),
    aboutQuote: text("about_quote"),
    aboutBody: text("about_body"),
    resumeUrl: text("resume_url"),
    email: text("email").notNull(),
    phone: text("phone"),
    whatsappNumber: text("whatsapp_number"),
    location: text("location"),
    // The hero's rotating outlined line (design.md §14.1): "Backend",
    // "Full-Stack", … — the component adds the "& ".
    headlineWords: text("headline_words")
      .array()
      .notNull()
      .default(emptyTextArray),
    ...translationsColumn,
    ...timestamps,
  },
  (t) => [
    check("profile_single_row", sql`${t.id} = 1`),
    check(
      "profile_availability",
      sql`${t.availability} IN ('open', 'limited', 'closed')`,
    ),
  ],
);

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    iconSlug: text("icon_slug"),
    iconUrl: text("icon_url"),
    ...ordering,
    ...timestamps,
  },
  (t) => [
    check(
      "skills_category",
      sql`${t.category} IN ('language', 'framework', 'tool', 'cloud', 'database')`,
    ),
  ],
);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  items: text("items").array().notNull().default(emptyTextArray),
  ...ordering,
  ...translationsColumn,
  ...timestamps,
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  techStack: text("tech_stack").array().notNull().default(emptyTextArray),
  categoryLabel: text("category_label"),
  liveUrl: text("live_url"),
  sourceUrl: text("source_url"),
  isLiveUrlPrivate: boolean("is_live_url_private").notNull().default(false),
  isSourceUrlPrivate: boolean("is_source_url_private").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  // Case-study text for the project page (design.md §14.10). A section with no
  // text is hidden; with none at all the page falls back to `description`.
  problem: text("problem"),
  approach: text("approach"),
  outcome: text("outcome"),
  galleryUrls: text("gallery_urls").array().notNull().default(emptyTextArray),
  ...ordering,
  ...translationsColumn,
  ...timestamps,
});

const timelineColumns = {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  organization: text("organization").notNull(),
  location: text("location"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  datesLabel: text("dates_label"),
  description: text("description"),
  logoUrl: text("logo_url"),
  linkUrl: text("link_url"),
};

export const journey = pgTable(
  "journey",
  {
    ...timelineColumns,
    type: text("type").notNull(),
    ...ordering,
    ...translationsColumn,
    ...timestamps,
  },
  (t) => [check("journey_type", sql`${t.type} IN ('work', 'education')`)],
);

export const volunteering = pgTable("volunteering", {
  ...timelineColumns,
  ...ordering,
  ...translationsColumn,
  ...timestamps,
});

// Certifications and course badges (design.md §13.17, Q22).
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  issuedOn: date("issued_on"),
  badgeUrl: text("badge_url"),
  credentialUrl: text("credential_url"),
  ...ordering,
  ...translationsColumn,
  ...timestamps,
});

export const socials = pgTable("socials", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  icon: text("icon").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  showOn: text("show_on")
    .array()
    .notNull()
    .default(sql`'{main,creatives,blog}'::text[]`),
  ...timestamps,
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  ...ordering,
  ...translationsColumn,
  ...timestamps,
});

// Blog posts (docs/content-schema.md §4, D83): written in the admin's block
// editor as custom markdown (docs/blog-markdown.md). Likes, comments and agent
// sessions arrive with their own steps.
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull().default(""),
    coverUrl: text("cover_url"),
    coverAlt: text("cover_alt"),
    tags: text("tags").array().notNull().default(emptyTextArray),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    commentsEnabled: boolean("comments_enabled").notNull().default(true),
    canonicalUrl: text("canonical_url"),
    series: text("series"),
    devtoId: integer("devto_id"),
    devtoUrl: text("devto_url"),
    likeCount: integer("like_count").notNull().default(0),
    ...translationsColumn,
    ...timestamps,
  },
  (t) => [
    check("blog_posts_status", sql`${t.status} IN ('draft', 'published')`),
  ],
);

// Likes on a post (content-schema.md §4): anyone can like, no account. The visitor
// is only a hash of a first-party cookie, so the table holds nothing that names a
// person. One like per browser; `blog_posts.like_count` is kept in step with it.
export const blogLikes = pgTable(
  "blog_likes",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.visitorHash] })],
);

// Readers (docs/content-schema.md §4, D83): the accounts of people who sign in to
// comment, in Better Auth's own tables (its field names, ours for the tables).
// `banned` and `is_author` are our two extra columns on the user.
export const readerUser = pgTable("reader_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  banned: boolean("banned").notNull().default(false),
  isAuthor: boolean("is_author").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const readerSession = pgTable("reader_session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => readerUser.id, { onDelete: "cascade" }),
});

export const readerAccount = pgTable("reader_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => readerUser.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const readerVerification = pgTable("reader_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Comments under a post (§13.37): plain text, one level of replies. A deleted
// account leaves its comments behind as "Deleted user" (`user_id` set null); a post
// or a parent comment going takes its comments with it.
export const blogComments = pgTable(
  "blog_comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => readerUser.id, {
      onDelete: "set null",
    }),
    parentId: integer("parent_id").references(
      (): AnyPgColumn => blogComments.id,
      {
        onDelete: "cascade",
      },
    ),
    body: text("body").notNull(),
    status: text("status").notNull().default("visible"),
    likeCount: integer("like_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check("blog_comments_status", sql`${t.status} IN ('visible', 'hidden')`),
    index("blog_comments_post_idx").on(t.postId, t.createdAt),
  ],
);

export const blogCommentLikes = pgTable(
  "blog_comment_likes",
  {
    commentId: integer("comment_id")
      .notNull()
      .references(() => blogComments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => readerUser.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.commentId, t.userId] })],
);

export const blogCommentReports = pgTable(
  "blog_comment_reports",
  {
    commentId: integer("comment_id")
      .notNull()
      .references(() => blogComments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => readerUser.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.commentId, t.userId] })],
);

// A redacted Claude Code session, replayed by a post's `session` block
// (docs/content-schema.md §4). Only the redacted turns are kept.
export const agentSessions = pgTable("agent_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull().default("claude-code"),
  turns: jsonb("turns").$type<SessionTurn[]>().notNull(),
  turnCount: integer("turn_count").notNull(),
  toolCallCount: integer("tool_call_count").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// The newsletter's wording and on/off switch (design.md §14.19), edited in the
// admin. One row (`id = 1`); a null text column uses the wording in
// content/copy.ts, so the row can start empty. The subscribers themselves are in
// Resend, not here.
export const newsletterSettings = pgTable(
  "newsletter_settings",
  {
    id: integer("id").primaryKey().default(1),
    enabled: boolean("enabled").notNull().default(true),
    boxLabel: text("box_label"),
    boxTitle: text("box_title"),
    boxText: text("box_text"),
    boxHelper: text("box_helper"),
    boxSuccess: text("box_success"),
    boxError: text("box_error"),
    boxInvalid: text("box_invalid"),
    boxRateLimited: text("box_rate_limited"),
    confirmedLabel: text("confirmed_label"),
    confirmedTitle: text("confirmed_title"),
    confirmedLead: text("confirmed_lead"),
    confirmedButton: text("confirmed_button"),
    failedLabel: text("failed_label"),
    failedTitle: text("failed_title"),
    failedLead: text("failed_lead"),
    failedButton: text("failed_button"),
    emailSubject: text("email_subject"),
    emailIntro: text("email_intro"),
    emailAction: text("email_action"),
    emailExpires: text("email_expires"),
    emailIgnore: text("email_ignore"),
    ...translationsColumn,
    ...timestamps,
  },
  (t) => [check("newsletter_settings_single_row", sql`${t.id} = 1`)],
);

// ---- Creatives (docs/content-schema.md §5, D86) -------------------------------------
// Design pieces, photography events, services and the page wording, edited in the
// admin; images are Cloudinary addresses with their pixel size so the gallery can
// reserve its space.

export type CreativeImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};
export type EventCredit = { role: string; name: string; url?: string };

export const designPieces = pgTable("design_pieces", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  coverUrl: text("cover_url").notNull(),
  coverWidth: integer("cover_width").notNull(),
  coverHeight: integer("cover_height").notNull(),
  coverAlt: text("cover_alt").notNull(),
  images: jsonb("images")
    .$type<CreativeImage[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  description: text("description"),
  client: text("client"),
  role: text("role"),
  tools: text("tools").array().notNull().default(emptyTextArray),
  year: integer("year"),
  linkUrl: text("link_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  ...ordering,
  ...translationsColumn,
  ...timestamps,
});

export const photoEvents = pgTable("photo_events", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  eventDate: date("event_date").notNull(),
  place: text("place"),
  kind: text("kind"),
  coverUrl: text("cover_url").notNull(),
  coverWidth: integer("cover_width").notNull(),
  coverHeight: integer("cover_height").notNull(),
  coverAlt: text("cover_alt").notNull(),
  description: text("description"),
  role: text("role"),
  covered: text("covered").array().notNull().default(emptyTextArray),
  images: jsonb("images")
    .$type<CreativeImage[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  credits: jsonb("credits")
    .$type<EventCredit[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  albumUrl: text("album_url"),
  albumLabel: text("album_label"),
  isFeatured: boolean("is_featured").notNull().default(false),
  ...ordering,
  ...translationsColumn,
  ...timestamps,
});

export const creativeServices = pgTable(
  "creative_services",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    groupName: text("group_name").notNull(),
    items: text("items").array().notNull().default(emptyTextArray),
    ...ordering,
    ...translationsColumn,
    ...timestamps,
  },
  (t) => [
    check(
      "creative_services_group",
      sql`${t.groupName} IN ('design', 'photography')`,
    ),
  ],
);

export const creativeFaqs = pgTable(
  "creative_faqs",
  {
    id: serial("id").primaryKey(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    groupName: text("group_name").notNull(),
    ...ordering,
    ...translationsColumn,
    ...timestamps,
  },
  (t) => [
    check(
      "creative_faqs_group",
      sql`${t.groupName} IN ('design', 'photography')`,
    ),
  ],
);

// The creatives site's wording (design.md §14.26): one row (`id = 1`); a null
// column uses the built-in wording in content/copy.ts.
export const creativesSettings = pgTable(
  "creatives_settings",
  {
    id: integer("id").primaryKey().default(1),
    heroStatement: text("hero_statement"),
    heroLine: text("hero_line"),
    designIntro: text("design_intro"),
    photographyIntro: text("photography_intro"),
    portalsTitle: text("portals_title"),
    portalDesignText: text("portal_design_text"),
    portalPhotographyText: text("portal_photography_text"),
    marqueeWords: text("marquee_words").array(),
    contactStatement: text("contact_statement"),
    contactText: text("contact_text"),
    contactNote: text("contact_note"),
    seoDescription: text("seo_description"),
    ...translationsColumn,
    ...timestamps,
  },
  (t) => [check("creatives_settings_single_row", sql`${t.id} = 1`)],
);
