import Link from "next/link";
import AsciiField from "@/components/field/AsciiField";
import ThemeToggle from "@/components/ThemeToggle";
import { logout } from "./actions";

/* The private side runs on the same ground, field and sheets as the public
   page — same measure, same chrome strip, same type. This subtree is covered
   by the `/dashboard/:path*` matcher in `proxy.ts`, so it only ever renders
   for a signed-in session. */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <AsciiField />

            <header className="console">
                <div className="console-top">
                    <Link href="/" className="navbar-brand">
                        &#8592; Rowan Shields
                    </Link>
                    <div className="console-right">
                        <nav className="navbar-links">
                            <Link href="/dashboard" className="navbar-link">
                                Overview
                            </Link>
                            <Link href="/dashboard/projects" className="navbar-link">
                                Projects
                            </Link>
                            <Link href="/dashboard/vault" className="navbar-link">
                                Vault
                            </Link>
                            <Link href="/dashboard/status" className="navbar-link">
                                Status
                            </Link>
                            <Link href="/dashboard/messages" className="navbar-link">
                                Messages
                            </Link>
                        </nav>
                        <ThemeToggle />
                        <form action={logout}>
                            <button type="submit" className="btn btn-ghost btn-sm">
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {children}
        </>
    );
}
