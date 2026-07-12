import { getPublishedProjects } from "@/db/queries";
import Image from "next/image";

export default async function Home() {

    const projects = await getPublishedProjects();

    return (
        <main className="page">
            <h1 style={{ fontSize: "1.8rem", marginBottom: "0.35rem" }}>Projects</h1>
            <p className="page-subtitle" style={{ marginTop: 0 }}>A selection of things I&apos;ve built</p>
            {projects.length === 0 ? (
                <p className="hint">No published projects yet.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                    {projects.map((p) => (
                        <article key={p.id} className="card" style={{ padding: "1.75rem" }}>
                            {p.thumbnailPath && (
                                <img
                                    src={p.thumbnailPath}
                                    alt=""
                                    style={{ width: "100%", maxHeight: 440, objectFit: "cover", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem" }}
                                />
                            )}
                            <h2 style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>{p.title}</h2>
                            {p.shortDescription && <p style={{ color: "var(--subtle)", fontSize: "1.05rem", lineHeight: 1.6 }}>{p.shortDescription}</p>}
                            {Array.isArray(p.techStack) && p.techStack.length > 0 && (
                                <p style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {(p.techStack as string[]).map((t) => (
                                        <span key={t} className="badge">{t}</span>
                                    ))}
                                </p>
                            )}
                            {(p.liveUrl || p.repoUrl) && (
                                <p style={{ marginTop: "1.25rem", display: "flex", gap: "1.5rem", fontSize: "1.05rem" }}>
                                    {p.liveUrl && <a href={p.liveUrl}>Live →</a>}
                                    {p.repoUrl && <a href={p.repoUrl}>Code →</a>}
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
