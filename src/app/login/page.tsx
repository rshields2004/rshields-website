"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
    const [state, formAction, pending] = useActionState(login, null);

    return (
        <main style={{ maxWidth: 360, margin: "4rem auto", padding: "1rem" }}>
            <h1>Sign in</h1>
            <form action={formAction} style={{ display: "grid", gap: "0.75rem" }}>
                <input name="email" type="email" placeholder="Email" required />
                <input name="password" type="password" placeholder="Password" required />
                <button type="submit" disabled={pending}>
                    {pending ? "Signing in…" : "Sign in"}
                </button>
                {state?.error && <p style={{ color: "#eb6f92" }}>{state.error}</p>}
            </form>
        </main>
    );
}