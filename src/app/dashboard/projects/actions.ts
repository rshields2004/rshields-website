"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { redirect } from "next/navigation";
import { saveThumbnail } from "@/lib/upload";

export async function setProjectStatus(formData: FormData) {
    const id = Number(formData.get("id"));
    const status = String(formData.get("status"));
    
    if (!Number.isInteger(id) || (status !== "draft" && status !== "published")) {
        return;
    }

    await db.update(projects).set({
        status,
        updatedAt: sql`now()`,
        ...(status === "published" ? { publishedAt: sql`coalesce(published_at, now())`} : {}), 
    })
    .where(eq(projects.id, id));

    revalidatePath("/dashboard/projects");
    revalidatePath("/");
}

export async function deleteProject(formData: FormData) {
    const id = Number(formData.get("id"));
    
    if (!Number.isInteger(id)) {
        return;
    }

    await db.delete(projects).where(eq(projects.id, id));

    revalidatePath("/dashboard/projects");
    revalidatePath("/");
}


function slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parse(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    let slug = String(formData.get("slug") ?? "").trim();
    if (!slug) slug = slugify(title);

    const techRaw = String(formData.get("techStack") ?? "").trim();
    const techStack = techRaw ? techRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

    const str = (k: string) => {
        const v = String(formData.get(k) ?? "").trim();
        return v === "" ? null : v;
    };

    return {
        title,
        slug,
        status: String(formData.get("status") ?? "draft"),
        shortDescription: str("shortDescription"),
        description: str("description"),
        category: str("category"),
        repoUrl: str("repoUrl"),
        liveUrl: str("liveUrl"),
        techStack,
        sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    };
}

function validate(d: ReturnType<typeof parse>) {
    if (!d.title) {
        return "Title is required.";
    }
    if (!d.slug) {
        return "Slug is required (or give a title to derive one).";
    }
    if (d.status !== "draft" && d.status !== "published") {
        return "Invalid status.";
    }
    return null;
}

export async function createProject(_prev: unknown, formData: FormData) {
    const d = parse(formData);
    const err = validate(d);
    if (err) return { error: err };

    const [dupe] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, d.slug)).limit(1);
    if (dupe) return { error: `Slug "${d.slug}" is already taken.` };

    const thumb = formData.get("thumbnail");
    let thumbnailPath: string | null = null;
    if (thumb instanceof File && thumb.size > 0) {
        try {
        thumbnailPath = await saveThumbnail(thumb);
        } catch (e) {
        return { error: e instanceof Error ? e.message : "Thumbnail upload failed." };
        }
    }

    await db.insert(projects).values({
        ...d,
        thumbnailPath,
        publishedAt: d.status === "published" ? sql`now()` : null,
    });

    revalidatePath("/dashboard/projects");
    revalidatePath("/");
    redirect("/dashboard/projects");
}

export async function updateProject(_prev: unknown, formData: FormData) {
    const id = Number(formData.get("id"));
    if (!Number.isInteger(id)) return { error: "Missing project id." };

    const d = parse(formData);
    const err = validate(d);
    if (err) return { error: err };

    const [dupe] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, d.slug)).limit(1);
    if (dupe && dupe.id !== id) return { error: `Slug "${d.slug}" is used by another project.` };

    const thumb = formData.get("thumbnail");
    let thumbnailPath = String(formData.get("existingThumbnail") ?? "") || null;
    if (thumb instanceof File && thumb.size > 0) {
        try {
        thumbnailPath = await saveThumbnail(thumb);
        } catch (e) {
        return { error: e instanceof Error ? e.message : "Thumbnail upload failed." };
        }
    }

    await db
        .update(projects)
        .set({
        ...d,
        thumbnailPath,
        updatedAt: sql`now()`,
        ...(d.status === "published" ? { publishedAt: sql`coalesce(published_at, now())` } : {}),
        })
        .where(eq(projects.id, id));

    revalidatePath("/dashboard/projects");
    revalidatePath("/");
    redirect("/dashboard/projects");
}
