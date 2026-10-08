CREATE TABLE "newsletter_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"box_label" text,
	"box_title" text,
	"box_text" text,
	"box_helper" text,
	"box_success" text,
	"box_error" text,
	"box_invalid" text,
	"box_rate_limited" text,
	"confirmed_label" text,
	"confirmed_title" text,
	"confirmed_lead" text,
	"confirmed_button" text,
	"failed_label" text,
	"failed_title" text,
	"failed_lead" text,
	"failed_button" text,
	"email_subject" text,
	"email_intro" text,
	"email_action" text,
	"email_expires" text,
	"email_ignore" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_settings_single_row" CHECK ("newsletter_settings"."id" = 1)
);

--> statement-breakpoint
-- Same updated_at trigger as every other table (see 0001).
CREATE TRIGGER newsletter_settings_set_updated_at BEFORE UPDATE ON "newsletter_settings" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
