CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"organization" text NOT NULL,
	"location" text,
	"start_date" date,
	"end_date" date,
	"dates_label" text,
	"description" text,
	"logo_url" text,
	"link_url" text,
	"type" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journey_type" CHECK ("journey"."type" IN ('work', 'education'))
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"display_name" text,
	"headline" text NOT NULL,
	"tagline" text,
	"availability" text,
	"hero_image_url" text,
	"about_quote" text,
	"about_body" text,
	"resume_url" text,
	"email" text NOT NULL,
	"phone" text,
	"whatsapp_number" text,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_single_row" CHECK ("profile"."id" = 1),
	CONSTRAINT "profile_availability" CHECK ("profile"."availability" IN ('open', 'limited', 'closed'))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text,
	"image_url" text,
	"tech_stack" text[] DEFAULT '{}'::text[] NOT NULL,
	"category_label" text,
	"live_url" text,
	"source_url" text,
	"is_live_url_private" boolean DEFAULT false NOT NULL,
	"is_source_url_private" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"items" text[] DEFAULT '{}'::text[] NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"icon_slug" text,
	"icon_url" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_category" CHECK ("skills"."category" IN ('language', 'framework', 'tool', 'cloud', 'database'))
);
--> statement-breakpoint
CREATE TABLE "socials" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"icon" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"show_on" text[] DEFAULT '{main,creatives,blog}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteering" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"organization" text NOT NULL,
	"location" text,
	"start_date" date,
	"end_date" date,
	"dates_label" text,
	"description" text,
	"logo_url" text,
	"link_url" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
