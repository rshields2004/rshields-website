import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, projects } from "./schema";
import type { InferInsertModel } from "drizzle-orm";

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

/* Fetched from the live docs at rshields.xyz/docs/index.html on 2026-09-03 —
   the URLs given for this project (rshields.xyz/jme, rshields.xyz/jme/docs)
   both 404; the app actually lives at the domain root and its docs at
   /docs. Quoted/paraphrased directly from that page rather than invented.
   No screenshots yet — `images` stays empty until they're added by hand
   through the dashboard's project editor. */
const JME_PROJECT = {
    title: "Junction Modeller Expanded (Dissertation Project)",
    slug: "jme",
    shortDescription:
        "A 3D traffic simulation platform for designing, analysing, and visualising junction networks, built for the browser.",
    description:
        "Junction Modeller Expanded lets you build intersections and roundabouts, " +
        "connect them with road links, run realistic traffic simulations, and " +
        "evaluate performance with industry-standard metrics. It has two " +
        "operational modes — View for observation and Build for design — with " +
        "traffic-light controlled intersections and give-way roundabouts, vehicle " +
        "physics based on the Intelligent Driver Model, real-time performance " +
        "metrics (throughput, wait times, Level of Service ratings), PDF report " +
        "generation, save/load, and peer-to-peer multiplayer collaboration over WebRTC.",
    status: "published" as const,
    category: "Simulation",
    techStack: [
        "Next.js 16",
        "React 19",
        "TypeScript 5",
        "Three.js",
        "React Three Fiber",
        "PeerJS",
        "Tailwind CSS 4",
        "shadcn/ui",
    ],
    repoUrl: null,
    // The brief's URLs 404 — this is the address that actually resolves.
    liveUrl: "https://rshields.xyz",
    images: [] as string[],
    sortOrder: -1, // ahead of the seeded test project
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

async function seedProject(data: typeof TEST_PROJECT | typeof JME_PROJECT) {
    const [existing] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, data.slug)).limit(1);

    if (existing) {
        console.log(`Project: "${data.slug}" already exists (id ${existing.id}) — skipping.`);
        return;
    }

    const [created] = await db.insert(projects).values({
        ...data,
        publishedAt: new Date().toISOString(), // stamp it live, matching timestamp mode: 'string'
    } as InferInsertModel<typeof projects>).returning({ id: projects.id });

    console.log(`Project: created "${data.title}" (id ${created.id}).`);
}

async function seed() {
    await seedAdmin();
    await seedProject(TEST_PROJECT);
    await seedProject(JME_PROJECT);
    process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });