import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import Link from "next/link";
import { sessionOptions, type SessionData } from "@/lib/session";
import { logout } from "./actions";

const VAULT_URL = process.env.NEXT_PUBLIC_VAULT_URL ?? "http://localhost:8082";

export default async function Dashboard() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    return (
        <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Dashboard</h1>
                <form action={logout}>
                    <button type="submit">Sign out</button>
                </form>
            </div>
            <p>Signed in as {session.email}</p>

            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: "1.5rem" }}>
                <Link href="/dashboard/projects" style={{ display: "block", padding: "1.25rem", border: "1px solid #26233a", borderRadius: 8, textDecoration: "none" }}>
                    <strong>Manage projects</strong>
                    <div style={{ opacity: 0.7, marginTop: "0.25rem" }}>Create, edit, publish</div>
                </Link>

                <Link href="/dashboard/vault" style={{ display: "block", padding: "1.25rem", border: "1px solid #26233a", borderRadius: 8, textDecoration: "none" }}>
                    <strong>File vault</strong>
                    <div style={{ opacity: 0.7, marginTop: "0.25rem" }}>Browse and upload files</div>
                </Link>
            </div>
        </main>
    );
}