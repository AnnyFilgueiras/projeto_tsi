CREATE TABLE "catalog_cuisines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"continents" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_cuisines_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "catalog_dish_photos" (
	"dish_id" uuid PRIMARY KEY NOT NULL,
	"file_hash" text NOT NULL,
	"author" text NOT NULL,
	"title" text,
	"source_url" text NOT NULL,
	"license" text NOT NULL,
	"license_url" text,
	"modified" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_dishes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cuisine_id" uuid NOT NULL,
	"base_dish_id" uuid,
	"publication_state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_ingredient_substitutions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"substitute_id" uuid NOT NULL,
	"substitute_allergens" jsonb NOT NULL,
	"allergen_state" text NOT NULL,
	"confirmed_allergen_free" boolean DEFAULT false NOT NULL,
	"origin" text NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_ingredients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"allergens" jsonb NOT NULL,
	"lactose_free" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "catalog_recipe_ingredients" (
	"dish_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"quantity" text,
	"unit" text,
	CONSTRAINT "catalog_recipe_ingredients_pk" PRIMARY KEY("dish_id","ingredient_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_recipe_utensils" (
	"dish_id" uuid NOT NULL,
	"utensil_id" uuid NOT NULL,
	CONSTRAINT "catalog_recipe_utensils_pk" PRIMARY KEY("dish_id","utensil_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_recipes" (
	"dish_id" uuid PRIMARY KEY NOT NULL,
	"prep_time_minutes" integer NOT NULL,
	"difficulty" text NOT NULL,
	"steps" jsonb NOT NULL,
	"allergens" jsonb NOT NULL,
	"allergen_state" text NOT NULL,
	"confirmed_allergen_free" boolean DEFAULT false NOT NULL,
	"allergens_updated_at" timestamp with time zone NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"origin" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_utensils" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_utensils_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "importer_idempotency_keys" (
	"account_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"payload_hash" text NOT NULL,
	"status_code" integer NOT NULL,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "importer_idempotency_keys_pk" PRIMARY KEY("account_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "importer_proposals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"publication_state" text NOT NULL,
	"origin" text NOT NULL,
	"data" jsonb NOT NULL,
	"confirmed_allergen_free" boolean DEFAULT false NOT NULL,
	"photo" jsonb,
	"uncertainties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_output" jsonb,
	"model" text,
	"schema_version" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"verification_checklist" jsonb,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_badge_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"milestone" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_badge_definitions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "catalog_dish_photos" ADD CONSTRAINT "catalog_dish_photos_dish_id_catalog_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."catalog_dishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_dishes" ADD CONSTRAINT "catalog_dishes_cuisine_id_catalog_cuisines_id_fk" FOREIGN KEY ("cuisine_id") REFERENCES "public"."catalog_cuisines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_dishes" ADD CONSTRAINT "catalog_dishes_base_dish_id_catalog_dishes_id_fk" FOREIGN KEY ("base_dish_id") REFERENCES "public"."catalog_dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_ingredient_substitutions" ADD CONSTRAINT "catalog_ingredient_substitutions_ingredient_id_catalog_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."catalog_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_ingredient_substitutions" ADD CONSTRAINT "catalog_ingredient_substitutions_substitute_id_catalog_ingredients_id_fk" FOREIGN KEY ("substitute_id") REFERENCES "public"."catalog_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_recipe_ingredients" ADD CONSTRAINT "catalog_recipe_ingredients_dish_id_catalog_recipes_dish_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."catalog_recipes"("dish_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_recipe_ingredients" ADD CONSTRAINT "catalog_recipe_ingredients_ingredient_id_catalog_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."catalog_ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_recipe_utensils" ADD CONSTRAINT "catalog_recipe_utensils_dish_id_catalog_recipes_dish_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."catalog_recipes"("dish_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_recipe_utensils" ADD CONSTRAINT "catalog_recipe_utensils_utensil_id_catalog_utensils_id_fk" FOREIGN KEY ("utensil_id") REFERENCES "public"."catalog_utensils"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_recipes" ADD CONSTRAINT "catalog_recipes_dish_id_catalog_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."catalog_dishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_dish_photos_file_hash_idx" ON "catalog_dish_photos" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "catalog_dishes_cuisine_id_idx" ON "catalog_dishes" USING btree ("cuisine_id");--> statement-breakpoint
CREATE INDEX "catalog_dishes_base_dish_id_idx" ON "catalog_dishes" USING btree ("base_dish_id");--> statement-breakpoint
CREATE INDEX "catalog_dishes_publication_state_idx" ON "catalog_dishes" USING btree ("publication_state");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_ingredient_substitutions_pair_uidx" ON "catalog_ingredient_substitutions" USING btree ("ingredient_id","substitute_id");--> statement-breakpoint
CREATE INDEX "catalog_ingredient_substitutions_ingredient_id_idx" ON "catalog_ingredient_substitutions" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "importer_proposals_state_created_idx" ON "importer_proposals" USING btree ("publication_state","created_at");