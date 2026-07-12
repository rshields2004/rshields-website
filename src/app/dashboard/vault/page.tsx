"use client";

import { useState } from "react";

export default function VaultTestPage() {
    const [status, setStatus] = useState("");

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setStatus(`Requesting URL for ${file.name}…`);

        // 1) ask our server for a presigned URL
        const res = await fetch("/api/vault/presign-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const { url, error } = await res.json();
        if (error) { setStatus(`Error: ${error}`); return; }

        // 2) upload the bytes DIRECTLY to Garage — note: no /api/, straight to S3
        setStatus("Uploading straight to Garage…");
        const put = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
        });

        setStatus(put.ok ? `✓ Uploaded ${file.name}` : `Upload failed: ${put.status}`);
    }

    return (
        <main style={{ padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
            <h1>Vault upload test</h1>
            <input type="file" onChange={handleUpload} />
            <p style={{ marginTop: "1rem" }}>{status}</p>
        </main>
    );
}