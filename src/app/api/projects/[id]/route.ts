import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getProjectById } from "@/db/queries";
import { sessionOptions, type SessionData } from "@/lib/session";
import { normalizeProjectInput, validateProject, slugify } from "@/lib/projects";

async function authed() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    return session.isLoggedIn;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const row = await getProjectById(Number(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ project: row });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const numId = Number((await params).id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const existing = await getProjectById(numId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let body: Record<string, unknown>;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

    const base = {
        title: existing.title,
        slug: existing.slug,
        status: existing.status as "draft" | "published",
        shortDescription: existing.shortDescription,
        description: existing.description,
        category: existing.category,
        repoUrl: existing.repoUrl,
        liveUrl: existing.liveUrl,
        techStack: existing.techStack as string[],
        sortOrder: existing.sortOrder,
    };
    const merged = { ...base, ...normalizeProjectInput(body) };
    merged.slug = merged.slug || slugify(merged.title);

    const err = validateProject(merged);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const [dupe] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, merged.slug)).limit(1);
    if (dupe && dupe.id !== numId) return NextResponse.json({ error: `Slug "${merged.slug}" is used by another project.` }, { status: 409 });

    const [updated] = await db.update(projects).set({
        ...merged,
        updatedAt: sql`now()`,
        ...(merged.status === "published" ? { publishedAt: sql`coalesce(published_at, now())` } : {}),
    }).where(eq(projects.id, numId)).returning();

    revalidatePath("/dashboard/projects");
    revalidatePath("/");
    return NextResponse.json({ project: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const numId = Number((await params).id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await db.delete(projects).where(eq(projects.id, numId));
    revalidatePath("/dashboard/projects");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
}