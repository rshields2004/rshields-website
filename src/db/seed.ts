import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, projects } from "./schema";

const ADMIN_NAME = "Rowan Shields";
const ADMIN_EMAIL = "rshields04@outlook.com";     // your login email
const ADMIN_PASSWORD = "changeme";    // your login password

const TEST_PROJECT = {
    title: "Test Project",
    slug: "test-project",
    shortDescription: "A seeded project to exercise the dashboard and public page.",
    description: "Longer body text for the test project.",
    status: "published" as const,               // published so it shows on the public page too
    category: "Web",
    techStack: ["Next.js", "TypeScript", "Drizzle", "PostgreSQL"], // jsonb — pass a real array
    repoUrl: "https://github.com/example/test-project",
    liveUrl: "https://example.com",
    sortOrder: 0,
};

async function seedAdmin() {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);

    if (existing) {
        await db.update(users).set({ password: passwordHash, name: ADMIN_NAME }).where(eq(users.id, existing.id));
        console.log(`Admin: updated ${ADMIN_EMAIL} (id ${existing.id}).`);
    } else {
        const [created] = await db.insert(users).values({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: passwordHash }).returning({ id: users.id });
        console.log(`Admin: created ${ADMIN_EMAIL} (id ${created.id}).`);
    }
}

async function seedTestProject() {
    const [existing] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, TEST_PROJECT.slug)).limit(1);

    if (existing) {
        console.log(`Project: "${TEST_PROJECT.slug}" already exists (id ${existing.id}) — skipping.`);
        return;
    }

    const [created] = await db.insert(projects).values({
        ...TEST_PROJECT,
        publishedAt: new Date().toISOString(), // stamp it live, matching timestamp mode: 'string'
    }).returning({ id: projects.id });

    console.log(`Project: created "${TEST_PROJECT.title}" (id ${created.id}).`);
}

async function seed() {
    await seedAdmin();
    await seedTestProject();
    process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });