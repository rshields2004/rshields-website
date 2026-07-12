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

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Link href="/dashboard/projects" className="card-link card-link-lg">
                    <div>
                        <strong>Manage projects</strong>
                        <div className="card-desc">Create, edit, publish</div>
                    </div>
                    <span className="card-link-arrow">→</span>
                </Link>

                <Link href="/dashboard/vault" className="card-link card-link-lg">
                    <div>
                        <strong>File vault</strong>
                        <div className="card-desc">Browse and upload files</div>
                    </div>
                    <span className="card-link-arrow">→</span>
                </Link>

                <Link href="/dashboard/status" className="card-link card-link-lg">
                    <div>
                        <strong>Service status</strong>
                        <div className="card-desc">Health of dependencies</div>
                    </div>
                    <span className="card-link-arrow">→</span>
                </Link>
            </div>
        </main>
    );
}