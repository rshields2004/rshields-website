import Link from "next/link";
import { getAllProjects } from "@/db/queries";
import { deleteProject, setProjectStatus } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";

export default async function ProjectsAdmin() {
    const rows = await getAllProjects();

    return (
        <main className="page">
            <div className="page-header">
                <h1 style={{ fontSize: "1.8rem" }}>Projects</h1>
                <Link href="/dashboard/projects/new" className="btn btn-primary btn-sm">
                    + New project
                </Link>
            </div>

            {rows.length === 0 ? (
                <p className="hint">No projects yet.</p>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: "1.1rem" }}>Title</th>
                                <th>Status</th>
                                <th>Order</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ paddingLeft: "1.1rem" }}>{p.title}</td>
                                    <td>
                                        <span className={`badge ${p.status === "published" ? "badge-published" : "badge-draft"}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>{p.sortOrder}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingRight: "1.1rem" }}>
                                            <Link href={`/dashboard/projects/${p.id}`} className="btn btn-ghost btn-sm">
                                                Edit
                                            </Link>

                                            <form action={setProjectStatus}>
                                                <input type="hidden" name="id" value={p.id} />
                                                <input type="hidden" name="status" value={p.status === "published" ? "draft" : "published"} />
                                                <button type="submit" className="btn btn-secondary btn-sm">
                                                    {p.status === "published" ? "Unpublish" : "Publish"}
                                                </button>
                                            </form>

                                            <form action={deleteProject}>
                                                <input type="hidden" name="id" value={p.id} />
                                                <ConfirmButton message={`Delete "${p.title}"? This cannot be undone.`}>Delete</ConfirmButton>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}