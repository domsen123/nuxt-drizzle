CREATE TABLE "file_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"alt" text,
	"title" text,
	"description" text,
	"focus_x" real DEFAULT 0.5 NOT NULL,
	"focus_y" real DEFAULT 0.5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "file_metadata_file_id_unique" UNIQUE("file_id")
);
--> statement-breakpoint
ALTER TABLE "file_metadata" ADD CONSTRAINT "file_metadata_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;