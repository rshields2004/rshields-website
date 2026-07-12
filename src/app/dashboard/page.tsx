import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import Link from "next/link";
import { sessionOptions, type SessionData } from "@/lib/session";

export default async function Dashboard() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    return (
        <main className="page">
            <h1 style={{ fontSize: "1.8rem", marginBottom: "0.35rem" }}>Dashboard</h1>
            <p className="page-subtitle" style={{ marginTop: 0 }}>Signed in as {session.email}</p>

            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <Link href="/dashboard/projects" className="card-link">
                    <strong>Manage projects</strong>
                    <div className="card-desc">Create, edit, publish</div>
                </Link>

                <Link href="/dashboard/vault" className="card-link">
                    <strong>File vault</strong>
                    <div className="card-desc">Browse and upload files</div>
                </Link>

                <Link href="/dashboard/status" className="card-link">
                    <strong>Service status</strong>
                    <div className="card-desc">Health of dependencies</div>
                </Link>
            </div>
        </main>
    );
}