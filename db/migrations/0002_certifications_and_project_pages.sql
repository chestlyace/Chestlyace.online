CREATE TABLE "certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"issuer" text NOT NULL,
	"issued_on" date,
	"badge_url" text,
	"credential_url" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "headline_words" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "problem" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "approach" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "outcome" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "gallery_urls" text[] DEFAULT '{}'::text[] NOT NULL;