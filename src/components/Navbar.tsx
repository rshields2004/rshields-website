import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import Link from "next/link";
import { sessionOptions, type SessionData } from "@/lib/session";
import { logout } from "@/app/dashboard/actions";

export default async function Navbar() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    return (
        <header className="navbar">
            <Link href="/" className="navbar-brand">
                Rowan Shields
            </Link>
            <nav className="navbar-links">
                <Link href="/" className="navbar-link">
                    Projects
                </Link>
                {session.isLoggedIn ? (
                    <>
                        <Link href="/dashboard" className="navbar-link">
                            Dashboard
                        </Link>
                        <Link href="/dashboard/vault" className="navbar-link">
                            Vault
                        </Link>
                        <Link href="/dashboard/status" className="navbar-link">
                            Status
                        </Link>
                        <form action={logout}>
                            <button type="submit" className="btn btn-ghost btn-sm">
                                Sign out
                            </button>
                        </form>
                    </>
                ) : (
                    <Link href="/login" className="navbar-link">
                        Sign in
                    </Link>
                )}
            </nav>
        </header>
    );
}
