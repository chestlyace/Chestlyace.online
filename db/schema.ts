// Main-site schema — docs/content-schema.md §1.
// Every table has created_at/updated_at; a trigger (see migrations) keeps
// updated_at current on every UPDATE.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
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
  ...ordering,
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
    ...timestamps,
  },
  (t) => [check("journey_type", sql`${t.type} IN ('work', 'education')`)],
);

export const volunteering = pgTable("volunteering", {
  ...timelineColumns,
  ...ordering,
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
  ...timestamps,
});
