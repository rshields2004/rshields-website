import Link from "next/link";
import AsciiField from "@/components/field/AsciiField";
import LoginForm from "@/components/LoginForm";

/* The home page signs in through a dialog; this route still exists because
   `proxy.ts` redirects here when an unauthenticated request hits /dashboard,
   and because a bookmarked /login should work. Both share LoginForm, and it
   sits on the same field and ground as the rest of the site. */
export default function LoginPage() {
    return (
        <>
            <AsciiField />

            <main className="page-narrow" style={{ marginTop: "4rem" }}>
                <p style={{ marginBottom: "1.25rem" }}>
                    <Link href="/" className="navbar-brand">
                        &#8592; Rowan Shields
                    </Link>
                </p>

                <div className="card">
                    <div className="modal-title">Sign in</div>
                    <LoginForm autoFocus />
                </div>
            </main>
        </>
    );
}
