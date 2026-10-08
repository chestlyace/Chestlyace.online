CREATE TABLE "agent_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"source" text DEFAULT 'claude-code' NOT NULL,
	"turns" jsonb NOT NULL,
	"turn_count" integer NOT NULL,
	"tool_call_count" integer NOT NULL,
	"started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
