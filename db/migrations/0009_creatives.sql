CREATE TABLE "creative_faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"group_name" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creative_faqs_group" CHECK ("creative_faqs"."group_name" IN ('design', 'photography'))
);
--> statement-breakpoint
CREATE TABLE "creative_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"group_name" text NOT NULL,
	"items" text[] DEFAULT '{}'::text[] NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creative_services_group" CHECK ("creative_services"."group_name" IN ('design', 'photography'))
);
--> statement-breakpoint
CREATE TABLE "creatives_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"hero_statement" text,
	"hero_line" text,
	"design_intro" text,
	"photography_intro" text,
	"portals_title" text,
	"portal_design_text" text,
	"portal_photography_text" text,
	"marquee_words" text[],
	"contact_statement" text,
	"contact_text" text,
	"contact_note" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creatives_settings_single_row" CHECK ("creatives_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "design_pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"cover_url" text NOT NULL,
	"cover_width" integer NOT NULL,
	"cover_height" integer NOT NULL,
	"cover_alt" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"client" text,
	"role" text,
	"tools" text[] DEFAULT '{}'::text[] NOT NULL,
	"year" integer,
	"link_url" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "design_pieces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "photo_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"event_date" date NOT NULL,
	"place" text,
	"kind" text,
	"cover_url" text NOT NULL,
	"cover_width" integer NOT NULL,
	"cover_height" integer NOT NULL,
	"cover_alt" text NOT NULL,
	"description" text,
	"role" text,
	"covered" text[] DEFAULT '{}'::text[] NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"credits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"album_url" text,
	"album_label" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photo_events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
-- Same updated_at trigger as every other table (see 0001).
CREATE TRIGGER design_pieces_set_updated_at BEFORE UPDATE ON "design_pieces" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER photo_events_set_updated_at BEFORE UPDATE ON "photo_events" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER creative_services_set_updated_at BEFORE UPDATE ON "creative_services" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER creative_faqs_set_updated_at BEFORE UPDATE ON "creative_faqs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER creatives_settings_set_updated_at BEFORE UPDATE ON "creatives_settings" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
