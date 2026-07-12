"use client";

import { useState } from "react";

const PART_SIZE = 100 * 1024 * 1024; // 100 MB/part. To TEST without a huge file, drop to 5*1024*1024 (5MB min) and use a ~20MB file.
const CONCURRENCY = 4;                // parts uploaded in parallel

export default function VaultTestPage() {
    const [status, setStatus] = useState("");
    const [progress, setProgress] = useState(0);

    async function uploadSmall(file: File) {
        const res = await fetch("/api/vault/presign-upload", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const { url, error } = await res.json();
        if (error) throw new Error(error);
        const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
        if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
    }

    async function uploadMultipart(file: File) {
        const initRes = await fetch("/api/vault/multipart/create", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size, partSize: PART_SIZE }),
        });
        const init = await initRes.json();
        if (init.error) throw new Error(init.error);
        const { key, uploadId, partUrls } = init as { key: string; uploadId: string; partUrls: { partNumber: number; url: string }[] };
        console.log("multipart parts:", partUrls?.length, partUrls?.[0]);

        try {
            const parts: { PartNumber: number; ETag: string }[] = new Array(partUrls.length);
            let done = 0, cursor = 0;

            async function worker() {
                while (cursor < partUrls.length) {
                    const idx = cursor++;
                    const { partNumber, url } = partUrls[idx];
                    const start = (partNumber - 1) * PART_SIZE;
                    const blob = file.slice(start, start + PART_SIZE); // lazy slice — not loaded into memory
                    const put = await fetch(url, { method: "PUT", body: blob });
                    if (!put.ok) throw new Error(`Part ${partNumber} failed: ${put.status}`);
                    const etag = put.headers.get("ETag");
                    if (!etag) throw new Error(`Part ${partNumber}: no ETag (check CORS ExposeHeaders)`);
                    parts[idx] = { PartNumber: partNumber, ETag: etag };
                    setProgress(Math.round((++done / partUrls.length) * 100));
                }
            }
            await Promise.all(Array.from({ length: Math.min(CONCURRENCY, partUrls.length) }, worker));

            const compRes = await fetch("/api/vault/multipart/complete", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, uploadId, parts }),
            });
            const comp = await compRes.json();
            if (comp.error) throw new Error(comp.error);
        } catch (e) {
            await fetch("/api/vault/multipart/abort", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, uploadId }),
            }).catch(() => { });
            throw e;
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setProgress(0);
        const mb = (file.size / 1024 / 1024).toFixed(1);
        try {
            if (file.size > PART_SIZE) {
                setStatus(`Multipart: ${file.name} (${mb} MB)…`);
                await uploadMultipart(file);
            } else {
                setStatus(`Single upload: ${file.name} (${mb} MB)…`);
                await uploadSmall(file);
            }
            setStatus(`✓ Uploaded ${file.name}`);
        } catch (err) {
            setStatus(`Error: ${err instanceof Error ? err.message : "upload failed"}`);
        }
    }

    return (
        <main style={{ padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
            <h1>Vault upload test</h1>
            <input type="file" onChange={handleUpload} />
            {progress > 0 && <div style={{ marginTop: "1rem" }}>Progress: {progress}%</div>}
            <p style={{ marginTop: "1rem" }}>{status}</p>
        </main>
    );
}