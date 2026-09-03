"use client";

import { useActionState } from "react";
import { submitContactMessage } from "@/app/actions";

type State = { error: string } | { ok: true } | null;

export default function ContactForm() {
    const [state, formAction, pending] = useActionState<State, FormData>(
        submitContactMessage,
        null,
    );

    if (state && "ok" in state) {
        return (
            <p className="contact-sent">
                Thanks — that's landed. I'll get back to you soon.
            </p>
        );
    }

    return (
        <form action={formAction} className="contact-form">
            <div className="contact-form-row">
                <label className="field">
                    <span>Name</span>
                    <input name="name" type="text" required autoComplete="name" />
                </label>
                <label className="field">
                    <span>Email</span>
                    <input name="email" type="email" required autoComplete="email" />
                </label>
            </div>

            <label className="field">
                <span>Message</span>
                <textarea name="message" rows={6} required />
            </label>

            {state && "error" in state && <p className="error-text">{state.error}</p>}

            <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Sending…" : "Send message"}
            </button>
        </form>
    );
}
