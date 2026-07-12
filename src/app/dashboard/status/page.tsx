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
        <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Service Status</h1>
                <button onClick={check} disabled={loading} style={{ cursor: "pointer" }}>
                    {loading ? "Checking…" : "Re-check"}
                </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1.5rem" }}>
                <tbody>
                    {services.map((s) => (
                        <tr key={s.name} style={{ borderTop: "1px solid #26233a" }}>
                            <td style={{ padding: "0.75rem 0" }}>
                                <span style={{ color: s.ok ? "#9ccfd8" : "#eb6f92", marginRight: "0.5rem" }}>●</span>
                                <strong>{s.name}</strong>
                            </td>
                            <td style={{ padding: "0.75rem 0", opacity: 0.8 }}>{s.detail}</td>
                            <td style={{ padding: "0.75rem 0", textAlign: "right", opacity: 0.6, whiteSpace: "nowrap" }}>
                                {s.ms !== null ? `${s.ms} ms` : "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {checkedAt && (
                <p style={{ opacity: 0.5, marginTop: "1rem", fontSize: "0.85rem" }}>
                    Last checked {new Date(checkedAt).toLocaleTimeString()} · auto-refreshes every 30s
                </p>
            )}
        </main>
    );
}