import { connection } from "next/server";
import { getContactMessages } from "@/db/queries";
import { deleteContactMessage } from "@/app/actions";

export default async function MessagesPage() {
    /* Without this the page would prerender at build time (it has no cookies()
       call of its own) and new submissions would not appear until a rebuild —
       see the identical note on the home page. */
    await connection();
    const messages = await getContactMessages();

    return (
        <main className="page">
            <div className="page-header">
                <h1 className="page-title">Messages</h1>
                <span className="page-subtitle">
                    {messages.length} {messages.length === 1 ? "submission" : "submissions"}
                </span>
            </div>

            {messages.length === 0 ? (
                <p className="hint">No messages yet — submissions from the contact form land here.</p>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: "1.1rem" }}>From</th>
                                <th>Message</th>
                                <th>Received</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map((m) => (
                                <tr key={m.id}>
                                    <td style={{ paddingLeft: "1.1rem", whiteSpace: "nowrap" }}>
                                        <strong>{m.name}</strong>
                                        <br />
                                        <a href={`mailto:${m.email}`}>{m.email}</a>
                                    </td>
                                    <td style={{ maxWidth: 480, whiteSpace: "pre-wrap" }}>{m.message}</td>
                                    <td style={{ whiteSpace: "nowrap" }}>
                                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : "—"}
                                    </td>
                                    <td>
                                        <form action={deleteContactMessage}>
                                            <input type="hidden" name="id" value={m.id} />
                                            <button type="submit" className="btn btn-ghost btn-sm">
                                                Delete
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
