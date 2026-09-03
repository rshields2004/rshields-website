import { connection } from "next/server";
import Link from "next/link";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import Image from "next/image";
import { getPublishedProjects } from "@/db/queries";
import AsciiField from "@/components/field/AsciiField";
import FeaturedProjectCard from "@/components/FeaturedProjectCard";
import SocialLinks from "@/components/SocialLinks";
import ContactForm from "@/components/ContactForm";
import { findPortrait } from "@/lib/portrait";
import LoginDialog from "@/components/LoginDialog";
import ThemeToggle from "@/components/ThemeToggle";

/** `.rise` reads its delay from `--d`, so the page deals itself out. */
const stagger = (i: number) => ({ "--d": `${i * 45}ms` }) as React.CSSProperties;

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
    const portrait = findPortrait();

    const rows = projects.map((p, i) => {
        const stack = Array.isArray(p.techStack) ? (p.techStack as string[]) : [];
        const published = p.publishedAt ? new Date(p.publishedAt).getFullYear() : null;
        const images = Array.isArray(p.images) ? (p.images as string[]) : [];
        return { p, i, stack, published, images };
    });

    return (
        <>
            <AsciiField />

            <main className="home">
                <header className="masthead">
                    <div className="masthead-top">
                        <nav className="masthead-nav">
                            <Link href="/" className="navbar-link">
                                Home
                            </Link>
                            <a href="#work" className="navbar-link">
                                Projects
                            </a>
                            <a href="#contact" className="navbar-link">
                                Contact
                            </a>
                        </nav>
                        <div className="masthead-actions">
                            <ThemeToggle />
                            {isLoggedIn ? (
                                <Link
                                    href="/dashboard"
                                    className="btn btn-secondary btn-sm"
                                >
                                    Portal &#8599;
                                </Link>
                            ) : (
                                <LoginDialog />
                            )}
                        </div>
                    </div>

                    <div className="masthead-main">
                        <div className="masthead-intro">
                            <h1 className="rise">
                                <span>Rowan</span>
                                <span className="surname">Shields</span>
                            </h1>

                            <p className="strapline rise" style={stagger(1)}>
                                Personal site and dashboard. Everything here runs on
                                hardware I own — application, database, cache and object
                                store.
                            </p>

                            <div className="masthead-social rise" style={stagger(2)}>
                                <SocialLinks />
                            </div>
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
                </header>

                <section className="work" id="work">
                    <div className="work-title-row">
                        <span className="label">Featured projects</span>
                        <span className="label">
                            {projects.length.toString().padStart(2, "0")} total
                        </span>
                    </div>

                    {projects.length === 0 ? (
                        <p className="work-empty">No published projects yet.</p>
                    ) : (
                        <div className="featured-projects">
                        {rows.map(({ p, i, stack, published, images }) => (
                            <FeaturedProjectCard
                                key={p.id}
                                title={p.title}
                                shortDescription={p.shortDescription}
                                description={p.description}
                                techStack={stack}
                                images={images}
                                liveUrl={p.liveUrl}
                                repoUrl={p.repoUrl}
                                published={published}
                                reversed={Boolean(i % 2)}
                                style={stagger(i + 3)}
                            />
                        ))}
                        </div>
                    )}
                </section>

                <section className="contact" id="contact">
                    <div className="work-title-row">
                        <span className="label">Contact</span>
                        <span className="label">Let&rsquo;s talk</span>
                    </div>

                    <div className="contact-layout">
                        <div className="contact-intro">
                            <p className="contact-lede">
                                Got something you&rsquo;re building, or just want to
                                talk shop?
                            </p>
                            <a
                                className="contact-direct"
                                href="mailto:rshields04@outlook.com"
                            >
                                rshields04@outlook.com &#8599;
                            </a>
                        </div>

                        <ContactForm />
                    </div>
                </section>

                <footer className="colophon">
                    <span>Rowan Shields</span>
                    <span>Portfolio</span>
                    <span>Self-hosted</span>
                    <span>&copy; {new Date().getFullYear()}</span>
                </footer>
            </main>
        </>
    );
}
