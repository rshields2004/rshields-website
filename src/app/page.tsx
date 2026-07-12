import { getPublishedProjects } from "@/db/queries";
import Image from "next/image";

export default async function Home() {

    const projects = await getPublishedProjects();

    return (
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
            <h1>Projects</h1>
            {projects.length === 0 ? (
                <p>No published projects yet.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {projects.map((p) => (
                        <li key={p.id} style={{ marginBottom: "1.5rem" }}>
                            {p.thumbnailPath && (
                                <img src={p.thumbnailPath} alt="" style={{ maxWidth: 300, borderRadius: 8 }} />
                            )}
                            <h2>{p.title}</h2>
                            {p.shortDescription && <p>{p.shortDescription}</p>}
                            {Array.isArray(p.techStack) && (
                                <p style={{ opacity: 0.7 }}>{p.techStack.join(" · ")}</p>
                            )}
                            <p>
                                {p.liveUrl && <a href={p.liveUrl}>Live</a>}
                                {p.liveUrl && p.repoUrl && " | "}
                                {p.repoUrl && <a href={p.repoUrl}>Code</a>}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
