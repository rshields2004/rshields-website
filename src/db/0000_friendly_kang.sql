-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "projects" (
	"id" serial NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" varchar(300),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"category" varchar(255),
	"tech_stack" jsonb,
	"repo_url" varchar(255),
	"live_url" varchar(255),
	"thumbnail_path" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"name" text NOT NULL,
	"directory" text DEFAULT '/' NOT NULL,
	"is_folder" boolean DEFAULT false NOT NULL,
	"mime_type" text,
	"size" bigint DEFAULT 0 NOT NULL,
	"stored_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_user_id_directory_name_key" UNIQUE("user_id","name","directory")
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "files_user_dir_idx" ON "files" USING btree ("user_id" int8_ops,"directory" text_ops);
*/