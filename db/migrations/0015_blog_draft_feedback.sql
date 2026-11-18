CREATE TABLE "blog_draft_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"lang" text DEFAULT 'en' NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_draft_feedback_lang" CHECK ("blog_draft_feedback"."lang" IN ('en', 'fr'))
);
--> statement-breakpoint
ALTER TABLE "blog_draft_feedback" ADD CONSTRAINT "blog_draft_feedback_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_draft_feedback_post_idx" ON "blog_draft_feedback" USING btree ("post_id","created_at");