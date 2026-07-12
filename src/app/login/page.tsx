"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
    const [state, formAction, pending] = useActionState(login, null);

    return (
        <main className="page-narrow" style={{ marginTop: "4rem" }}>
            <div className="card">
                <h1 style={{ fontSize: "1.4rem", marginBottom: "1.25rem" }}>Sign in</h1>
                <form action={formAction} style={{ display: "grid", gap: "0.9rem" }}>
                    <input name="email" type="email" placeholder="Email" required />
                    <input name="password" type="password" placeholder="Password" required />
                    <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: "0.25rem" }}>
                        {pending ? "Signing in…" : "Sign in"}
                    </button>
                    {state?.error && <p className="error-text">{state.error}</p>}
                </form>
            </div>
        </main>
    );
}