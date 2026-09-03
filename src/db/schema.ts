import { pgTable, check, serial, varchar, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const projects = pgTable("projects", {
	id: serial().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	shortDescription: varchar("short_description", { length: 300 }),
	status: varchar({ length: 20 }).default('draft').notNull(),
	category: varchar({ length: 255 }),
	techStack: jsonb("tech_stack"),
	repoUrl: varchar("repo_url", { length: 255 }),
	liveUrl: varchar("live_url", { length: 255 }),
	thumbnailPath: varchar("thumbnail_path", { length: 255 }),
	images: jsonb("images").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	check("projects_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying])::text[])`),
]);

export const users = pgTable("users", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
