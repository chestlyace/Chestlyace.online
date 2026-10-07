CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"cover_url" text,
	"cover_alt" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"comments_enabled" boolean DEFAULT true NOT NULL,
	"canonical_url" text,
	"series" text,
	"devto_id" integer,
	"devto_url" text,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug"),
	CONSTRAINT "blog_posts_status" CHECK ("blog_posts"."status" IN ('draft', 'published'))
);
--> statement-breakpoint
-- Same updated_at trigger as every other table (see 0001).
CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON "blog_posts" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
