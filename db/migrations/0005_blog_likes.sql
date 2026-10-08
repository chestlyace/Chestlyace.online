CREATE TABLE "blog_likes" (
	"post_id" integer NOT NULL,
	"visitor_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_likes_post_id_visitor_hash_pk" PRIMARY KEY("post_id","visitor_hash")
);
--> statement-breakpoint
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;