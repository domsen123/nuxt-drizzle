CREATE TABLE "content_creator_clusters" (
	"id" text PRIMARY KEY NOT NULL,
	"pillar_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"keywords" text,
	"status" text DEFAULT 'idea' NOT NULL,
	"blog_post_id" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp with time zone,
	"generated_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_creator_pillars" (
	"id" text PRIMARY KEY NOT NULL,
	"seed_topic" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_creator_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"api_key_encrypted" text NOT NULL,
	"api_key_iv" text NOT NULL,
	"api_key_tag" text NOT NULL,
	"brand_voice" text,
	"production_interval" text DEFAULT 'weekly' NOT NULL,
	"production_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_creator_clusters" ADD CONSTRAINT "content_creator_clusters_pillar_id_content_creator_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."content_creator_pillars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_creator_clusters" ADD CONSTRAINT "content_creator_clusters_blog_post_id_blog_posts_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_creator_pillars" ADD CONSTRAINT "content_creator_pillars_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;