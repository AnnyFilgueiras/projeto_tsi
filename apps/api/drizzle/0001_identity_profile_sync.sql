CREATE TABLE "profile_restriction_types" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"associated_allergens" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_restrictions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"encrypted_type" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"key_version" integer NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"culinary_preferences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reminder_active" boolean DEFAULT false NOT NULL,
	"reminder_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reminder_frequency" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"email" text,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_access_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "identity_refresh_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"successor_id" uuid,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_refresh_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "sync_processed_operations" (
	"account_id" uuid NOT NULL,
	"op_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload_hash" text NOT NULL,
	"status" text NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sync_processed_operations_pk" PRIMARY KEY("account_id","op_id")
);
--> statement-breakpoint
ALTER TABLE "profile_restrictions" ADD CONSTRAINT "profile_restrictions_user_id_profile_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_refresh_sessions" ADD CONSTRAINT "identity_refresh_sessions_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_restrictions_user_id_idx" ON "profile_restrictions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "identity_refresh_sessions_account_id_idx" ON "identity_refresh_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "identity_refresh_sessions_family_id_idx" ON "identity_refresh_sessions" USING btree ("family_id");