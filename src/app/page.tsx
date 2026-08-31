import { connection } from "next/server";
import Link from "next/link";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import Image from "next/image";
import { getPublishedProjects } from "@/db/queries";
import AsciiField from "@/components/field/AsciiField";
import IndexRow from "@/components/field/IndexRow";
import { findPortrait } from "@/lib/portrait";
import LoginDialog from "@/components/LoginDialog";

/** `.rise` reads its delay from `--d`, so the page deals itself out. */
const stagger = (i: number) => ({ "--d": `${i * 45}ms` }) as React.CSSProperties;

/* Column headers are scaffolding until there are enough rows to justify them,
   so the index only becomes a table at volume. */
const TABLE_THRESHOLD = 4;

/* What actually runs the site. Mirrors the services in `lib/health.ts`. */
const INFRA = [
    {
        role: "Application",
        name: "Next.js 16",
        desc: "React 19 server components, rendered on demand.",
    },
    {
        role: "Database",
        name: "PostgreSQL",
        desc: "Projects and sessions, accessed through Drizzle.",
    },
    {
        role: "Cache",
        name: "Redis",
        desc: "Ephemeral state and health probes.",
    },
    {
        role: "Object store",
        name: "S3-compatible",
        desc: "File vault, presigned and multipart uploads.",
    },
];

export default async function Home() {
    /* Removing the global nav removed this page's only cookies() call, which
       had been what opted it out of prerendering. Without this the project
       index, the year and the portrait lookup would all be frozen at build
       time — publishing from the dashboard would not show up until a rebuild.
       connection() is the supported way to say "render per request" and, unlike
       `export const dynamic`, it survives Cache Components being turned on. */
    await connection();

    /* The masthead needs to know whether this visitor is signed in, so the
       action button can send them onward instead of asking them to sign in
       again. Only rendered for a live session, so visitors never see it. */
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const isLoggedIn = Boolean(session.isLoggedIn);

    const projects = await getPublishedProjects();
    const year = new Date().getFullYear();
    const asTable = projects.length >= TABLE_THRESHOLD;
    const portrait = findPortrait();

    const rows = projects.map((p, i) => {
        const href = p.liveUrl || p.repoUrl || undefined;
        const stack = Array.isArray(p.techStack) ? (p.techStack as string[]) : [];
        const published = p.publishedAt ? new Date(p.publishedAt).getFullYear() : null;
        return { p, i, href, stack, published };
    });

    return (
        <>
            <AsciiField />

            <main className="home">
                <header className="masthead">
                    <div className="masthead-top">
                        <span className="label">Portfolio</span>
                        {isLoggedIn ? (
                            <Link
                                href="/dashboard"
                                className="btn btn-secondary btn-sm"
                            >
                                Dashboard &#8594;
                            </Link>
                        ) : (
                            <LoginDialog />
                        )}
                    </div>

                    <div className="masthead-main">
                        <div>
                            <h1 className="rise">
                                <span>Rowan</span>
                                <span className="surname">Shields</span>
                            </h1>

                            <p className="strapline rise" style={stagger(1)}>
                                Personal site and dashboard. Everything here runs on
                                hardware I own — application, database, cache and object
                                store.
                            </p>
                        </div>

                        <div className="portrait rise" style={stagger(1)}>
                            {portrait ? (
                                <Image
                                    src={portrait}
                                    alt="Rowan Shields"
                                    fill
                                    sizes="(max-width: 900px) 45vw, 320px"
                                    priority
                                />
                            ) : (
                                <span className="portrait-empty">Photo</span>
                            )}
                        </div>
                    </div>

                    <dl className="masthead-meta rise" style={stagger(2)}>
                        <div>
                            <dt>Index</dt>
                            <dd>
                                {projects.length}{" "}
                                {projects.length === 1 ? "entry" : "entries"}, published
                            </dd>
                        </div>
                        <div>
                            <dt>Hosting</dt>
                            <dd>Self-hosted</dd>
                        </div>
                        <div>
                            <dt>Year</dt>
                            <dd>{year}</dd>
                        </div>
                    </dl>
                </header>

                <section className="work" id="work">
                    <div className="work-title-row">
                        <span className="label">Selected work</span>
                        <span className="label">
                            {projects.length.toString().padStart(2, "0")} total
                        </span>
                    </div>

                    {projects.length === 0 ? (
                        <p className="work-empty">No published projects yet.</p>
                    ) : asTable ? (
                        <>
                            <div className="index-head">
                                <span>No.</span>
                                <span>Project</span>
                                <span>Stack</span>
                                <span>Year</span>
                                <span />
                            </div>
                            {rows.map(({ p, i, href, stack, published }) => (
                                <IndexRow
                                    key={p.id}
                                    href={href}
                                    className="index-row rise"
                                    style={stagger(i + 3)}
                                >
                                    <span className="index-no">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span className="index-name">
                                        {p.title}
                                        {p.shortDescription && (
                                            <span className="index-desc">
                                                {p.shortDescription}
                                            </span>
                                        )}
                                    </span>
                                    <span className="index-stack">
                                        {stack.map((t) => (
                                            <span key={t}>{t}</span>
                                        ))}
                                    </span>
                                    <span className="index-year">{published ?? "—"}</span>
                                    <span className="index-arrow" aria-hidden="true">
                                        &#8599;
                                    </span>
                                </IndexRow>
                            ))}
                        </>
                    ) : (
                        rows.map(({ p, i, href, stack, published }) => (
                            <IndexRow
                                key={p.id}
                                href={href}
                                className="work-entry rise"
                                style={stagger(i + 3)}
                            >
                                <span className="work-no">
                                    {String(i + 1).padStart(2, "0")}
                                </span>

                                <span>
                                    <span className="work-title">{p.title}</span>
                                    {p.shortDescription && (
                                        <span className="work-desc">
                                            {p.shortDescription}
                                        </span>
                                    )}
                                </span>

                                <dl className="work-side">
                                    {stack.length > 0 && (
                                        <div>
                                            <dt>Stack</dt>
                                            <dd>{stack.join(" / ")}</dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt>Year</dt>
                                        <dd>{published ?? "—"}</dd>
                                    </div>
                                    {href && (
                                        <div>
                                            <span className="work-go">
                                                {p.liveUrl ? "Visit" : "Source"} &#8599;
                                            </span>
                                        </div>
                                    )}
                                </dl>
                            </IndexRow>
                        ))
                    )}
                </section>

                <section className="infra" id="infrastructure">
                    <div className="work-title-row">
                        <span className="label">Infrastructure</span>
                        <span className="label">What runs this</span>
                    </div>

                    <div className="infra-grid">
                        {INFRA.map((s) => (
                            <div className="infra-item" key={s.role}>
                                <span className="label">{s.role}</span>
                                <span className="infra-name">{s.name}</span>
                                <span className="infra-desc">{s.desc}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="colophon">
                    <span>Rowan Shields</span>
                    <span>Portfolio</span>
                    <span>Self-hosted</span>
                    <span>&copy; {year}</span>
                </footer>
            </main>
        </>
    );
}
