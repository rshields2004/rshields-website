import { stat } from "fs";
import { db } from "./index";
import { projects } from "./schema";
import { eq, asc, desc } from "drizzle-orm";


export async function getPublishedProjects() {
    return db.select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        shortDescription: projects.shortDescription,
        techStack: projects.techStack,
        repoUrl: projects.repoUrl,
        liveUrl: projects.liveUrl,
        thumbnailPath: projects.thumbnailPath,
        publishedAt: projects.publishedAt,
    })
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(asc(projects.sortOrder), desc(projects.publishedAt));
}

export async function getAllProjects() {

    return db.select({
        id: projects.id,
        title: projects.title,
        status: projects.status,
        sortOrder: projects.sortOrder,
        updatedAt: projects.updatedAt,
    })
    .from(projects)
    .orderBy(asc(projects.sortOrder), desc(projects.updatedAt));

}

export async function getProjectById(id: number) {
    const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return row ?? null;
}