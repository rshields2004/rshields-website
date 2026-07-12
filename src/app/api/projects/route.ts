import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getAllProjects } from "@/db/queries";
import { sessionOptions, type SessionData } from "@/lib/session";
import { normalizeProjectInput, validateProject, slugify, type ProjectInput } from "@/lib/projects";

async function authed() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    return session.isLoggedIn;
}

export async function GET() {
    if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ projects: await getAllProjects() });
}

export async function POST(request: NextRequest) {
    if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: Record<string, unknown>;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

    const p = normalizeProjectInput(body);
    const d: ProjectInput = {
        title: p.title ?? "",
        slug: p.slug || slugify(p.title ?? ""),
        status: p.status ?? "draft",
        shortDescription: p.shortDescription ?? null,
        description: p.description ?? null,
        category: p.category ?? null,
        repoUrl: p.repoUrl ?? null,
        liveUrl: p.liveUrl ?? null,
        techStack: p.techStack ?? [],
        sortOrder: p.sortOrder ?? 0,
    };

    const err = validateProject(d);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const [dupe] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, d.slug)).limit(1);
    if (dupe) return NextResponse.json({ error: `Slug "${d.slug}" is already taken.` }, { status: 409 });

    const [created] = await db.insert(projects).values({
        ...d,
        thumbnailPath: null,
        publishedAt: d.status === "published" ? sql`now()` : null,
    }).returning();

    revalidatePath("/dashboard/projects");
    revalidatePath("/");
    return NextResponse.json({ project: created }, { status: 201 });
}