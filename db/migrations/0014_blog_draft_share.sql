ALTER TABLE "blog_posts" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "share_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_share_token_unique" UNIQUE("share_token");--> statement-breakpoint
-- Turning sharing on or off is not an edit of the post (D93): the updated_at trigger
-- skips an UPDATE that changes only the share columns, so "Last saved" stays true.
DROP TRIGGER blog_posts_set_updated_at ON "blog_posts";--> statement-breakpoint
CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON "blog_posts" FOR EACH ROW WHEN ((to_jsonb(OLD) - 'share_token' - 'share_created_at' - 'updated_at') IS DISTINCT FROM (to_jsonb(NEW) - 'share_token' - 'share_created_at' - 'updated_at')) EXECUTE FUNCTION set_updated_at();
