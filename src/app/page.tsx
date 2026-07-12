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
                <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                    {projects.map((p) => (
                        <article key={p.id} className="card">
                            {p.thumbnailPath && (
                                <img
                                    src={p.thumbnailPath}
                                    alt=""
                                    style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: "var(--radius-sm)", marginBottom: "0.85rem" }}
                                />
                            )}
                            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.35rem" }}>{p.title}</h2>
                            {p.shortDescription && <p style={{ color: "var(--subtle)", fontSize: "0.9rem" }}>{p.shortDescription}</p>}
                            {Array.isArray(p.techStack) && p.techStack.length > 0 && (
                                <p style={{ marginTop: "0.6rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                    {(p.techStack as string[]).map((t) => (
                                        <span key={t} className="badge">{t}</span>
                                    ))}
                                </p>
                            )}
                            {(p.liveUrl || p.repoUrl) && (
                                <p style={{ marginTop: "0.85rem", display: "flex", gap: "1rem" }}>
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
