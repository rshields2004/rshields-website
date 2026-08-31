"use client";

import { useCallback, useEffect, useState } from "react";

type ServiceStatus = { name: string; ok: boolean; ms: number | null; detail: string };

export default function StatusPage() {
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [checkedAt, setCheckedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const check = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/status");
            const data = await res.json();
            if (res.ok) { setServices(data.services); setCheckedAt(data.checkedAt); }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        check();
        const id = setInterval(check, 30_000); // auto re-check every 30s
        return () => clearInterval(id);
    }, [check]);

    return (
        <main className="page">
            <div className="page-header" style={{ marginBottom: "1.5rem" }}>
                <h1 className="page-title">Service status</h1>
                <button onClick={check} disabled={loading} className="btn btn-secondary btn-sm">
                    {loading ? "Checking…" : "Re-check"}
                </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table className="table">
                    <tbody>
                        {services.map((s) => (
                            <tr key={s.name}>
                                <td style={{ paddingLeft: "1.1rem" }}>
                                    <span className={`dot ${s.ok ? "dot-ok" : "dot-bad"}`} />
                                    <strong>{s.name}</strong>
                                </td>
                                <td style={{ color: "var(--subtle)" }}>{s.detail}</td>
                                <td style={{ textAlign: "right", color: "var(--muted)", whiteSpace: "nowrap", paddingRight: "1.1rem" }}>
                                    {s.ms !== null ? `${s.ms} ms` : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {checkedAt && (
                <p className="hint" style={{ marginTop: "1rem" }}>
                    Last checked {new Date(checkedAt).toLocaleTimeString()} · auto-refreshes every 30s
                </p>
            )}
        </main>
    );
}