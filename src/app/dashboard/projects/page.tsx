import Link from "next/link";
import { getAllProjects } from "@/db/queries";
import { deleteProject, setProjectStatus } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";

export default async function ProjectsAdmin() {
    const rows = await getAllProjects();

    return (
        <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Projects</h1>
                <Link href="/dashboard/projects/new">+ New project</Link>
            </div>

            {rows.length === 0 ? (
                <p>No projects yet.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                    <thead>
                        <tr style={{ textAlign: "left", opacity: 0.7 }}>
                            <th style={{ padding: "0.5rem 0" }}>Title</th>
                            <th>Status</th>
                            <th>Order</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((p) => (
                            <tr key={p.id} style={{ borderTop: "1px solid #26233a" }}>
                                <td style={{ padding: "0.6rem 0" }}>{p.title}</td>
                                <td>{p.status}</td>
                                <td>{p.sortOrder}</td>
                                <td style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", padding: "0.6rem 0" }}>
                                    <Link href={`/dashboard/projects/${p.id}`}>Edit</Link>

                                    <form action={setProjectStatus}>
                                        <input type="hidden" name="id" value={p.id} />
                                        <input type="hidden" name="status" value={p.status === "published" ? "draft" : "published"} />
                                        <button type="submit">{p.status === "published" ? "Unpublish" : "Publish"}</button>
                                    </form>

                                    <form action={deleteProject}>
                                        <input type="hidden" name="id" value={p.id} />
                                        <ConfirmButton message={`Delete "${p.title}"? This cannot be undone.`}>Delete</ConfirmButton>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </main>
    );
}