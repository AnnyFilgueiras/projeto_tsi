CREATE TABLE "progress_badge_awards" (
	"user_id" uuid NOT NULL,
	"definition_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone NOT NULL,
	CONSTRAINT "progress_badge_awards_pk" PRIMARY KEY("user_id","definition_id")
);
--> statement-breakpoint
CREATE TABLE "progress_evolution_unlocks" (
	"user_id" uuid NOT NULL,
	"dish_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone NOT NULL,
	CONSTRAINT "progress_evolution_unlocks_pk" PRIMARY KEY("user_id","dish_id")
);
--> statement-breakpoint
CREATE TABLE "progress_ratings" (
	"id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"dish_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"changes" text,
	"item_id" uuid,
	"rated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_ratings_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "routine_idempotency_keys" (
	"account_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"endpoint" text NOT NULL,
	"payload_hash" text NOT NULL,
	"status_code" integer NOT NULL,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "routine_idempotency_keys_pk" PRIMARY KEY("account_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "routine_suggestions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"dish_id" uuid NOT NULL,
	"status" text NOT NULL,
	"session_key" text NOT NULL,
	"presented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "progress_badge_awards" ADD CONSTRAINT "progress_badge_awards_definition_id_progress_badge_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."progress_badge_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "progress_ratings_user_id_idx" ON "progress_ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_ratings_user_dish_idx" ON "progress_ratings" USING btree ("user_id","dish_id");--> statement-breakpoint
CREATE INDEX "routine_idempotency_keys_expires_at_idx" ON "routine_idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "routine_suggestions_user_status_idx" ON "routine_suggestions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "routine_suggestions_user_session_idx" ON "routine_suggestions" USING btree ("user_id","session_key");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_suggestions_user_dish_candidate_uidx" ON "routine_suggestions" USING btree ("user_id","dish_id") WHERE "routine_suggestions"."status" = 'candidate';