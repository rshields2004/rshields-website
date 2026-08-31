"use client";

import { useActionState } from "react";
import { login } from "@/app/login/actions";

/* Shared by the masthead dialog and the /login route, so the two can't drift.
   On success the action redirects to /dashboard; on failure it returns an
   error and the form stays put. */
export default function LoginForm({
    autoFocus = false,
    onCancel,
}: {
    autoFocus?: boolean;
    onCancel?: () => void;
}) {
    const [state, formAction, pending] = useActionState(login, null);

    return (
        <form action={formAction} className="login-form">
            <label className="field">
                <span>Email</span>
                <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus={autoFocus}
                />
            </label>

            <label className="field">
                <span>Password</span>
                <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                />
            </label>

            {state?.error && <p className="error-text">{state.error}</p>}

            <div className="modal-actions">
                {onCancel && (
                    <button type="button" className="btn btn-ghost" onClick={onCancel}>
                        Cancel
                    </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? "Signing in…" : "Sign in"}
                </button>
            </div>
        </form>
    );
}
