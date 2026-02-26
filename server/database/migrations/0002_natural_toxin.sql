ALTER TABLE "files" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "variant" text;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_parent_id_files_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;