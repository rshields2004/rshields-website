"use client";

import { useCallback, useEffect, useState } from "react";

const PART_SIZE = 100 * 1024 * 1024;
const CONCURRENCY = 4;

type FileEntry = { key: string; name: string; size: number; modified: string | null };
type FolderEntry = { name: string; prefix: string };

function formatSize(bytes: number): string {
    if (bytes === 0) return "—";
    const u = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function crumbs(prefix: string) {
    const parts = prefix.split("/").filter(Boolean);
    const acc: { label: string; prefix: string }[] = [{ label: "Vault", prefix: "" }];
    let cur = "";
    for (const p of parts) {
        cur += `${p}/`;
        acc.push({ label: p, prefix: cur });
    }
    return acc;
}

export default function VaultPage() {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [folders, setFolders] = useState<FolderEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [progress, setProgress] = useState(0);
    const [prefix, setPrefix] = useState(""); // "" = root; "documents/" = inside that folder

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/vault/list?prefix=${encodeURIComponent(prefix)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "List failed");
            setFiles(data.files);
            setFolders(data.folders);
        } catch (e) {
            setStatus(`Error listing: ${e instanceof Error ? e.message : "failed"}`);
        } finally {
            setLoading(false);
        }
    }, [prefix]); // ← now depends on prefix

    useEffect(() => { load(); }, [load]); // re-runs when prefix changes, since load's identity changes with it



    async function uploadSmall(file: File, key: string) {
        const res = await fetch("/api/vault/presign-upload", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: key, contentType: file.type }),
        });
        const { url, error } = await res.json();
        if (error) throw new Error(error);
        const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
        if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
    }

    async function uploadOne(file: File, key: string) {
        if (file.size > PART_SIZE) await uploadMultipart(file, key);
        else await uploadSmall(file, key);
    }

    async function uploadMultipart(file: File, key: string) {
        const initRes = await fetch("/api/vault/multipart/create", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: key, contentType: file.type, fileSize: file.size, partSize: PART_SIZE }),
        });
        const init = await initRes.json();
        if (init.error) throw new Error(init.error);
        const { uploadId, partUrls } = init as { key: string; uploadId: string; partUrls: { partNumber: number; url: string }[] };

        try {
            const parts: { PartNumber: number; ETag: string }[] = new Array(partUrls.length);
            let done = 0, cursor = 0;
            async function worker() {
                while (cursor < partUrls.length) {
                    const idx = cursor++;
                    const { partNumber, url } = partUrls[idx];
                    const start = (partNumber - 1) * PART_SIZE;
                    const blob = file.slice(start, start + PART_SIZE);
                    const put = await fetch(url, { method: "PUT", body: blob });
                    if (!put.ok) throw new Error(`Part ${partNumber} failed: ${put.status}`);
                    const etag = put.headers.get("ETag");
                    if (!etag) throw new Error(`Part ${partNumber}: no ETag`);
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

    async function handleFolderUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files;
        if (!list || list.length === 0) return;
        const all = Array.from(list);
        setProgress(0);

        let done = 0, cursor = 0, failed = 0;
        const FOLDER_CONCURRENCY = 3; // whole files in parallel (each large file still parallelises its own parts)

        async function worker() {
            while (cursor < all.length) {
                const file = all[cursor++];
                // webkitRelativePath = "chosenFolder/sub/file.ext"; fall back to name if absent
                const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
                const key = prefix + rel;
                try {
                    setStatus(`Uploading ${done + 1}/${all.length}: ${rel}…`);
                    await uploadOne(file, key);
                } catch {
                    failed++;
                }
                setProgress(Math.round((++done / all.length) * 100));
            }
        }

        try {
            await Promise.all(Array.from({ length: Math.min(FOLDER_CONCURRENCY, all.length) }, worker));
            setStatus(failed ? `Done with ${failed} failed of ${all.length}.` : `✓ Uploaded ${all.length} files`);
            setProgress(0);
            await load();
        } catch (err) {
            setStatus(`Error: ${err instanceof Error ? err.message : "folder upload failed"}`);
        }
        e.target.value = "";
    }

    async function handleNewFolder() {
        const name = prompt("New folder name:");
        if (!name) return;
        setStatus(`Creating folder ${name}…`);
        try {
            const res = await fetch("/api/vault/folder", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefix, name: name.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Create failed");
            setStatus(`✓ Created ${name}`);
            await load(); // refresh so the folder appears
        } catch (e) {
            setStatus(`Error: ${e instanceof Error ? e.message : "create failed"}`);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setProgress(0);
        const mb = (file.size / 1024 / 1024).toFixed(1);
        try {
            setStatus(`Uploading ${file.name} (${mb} MB)…`);
            await uploadOne(file, prefix + file.name);
            setStatus(`✓ Uploaded ${file.name}`);
            setProgress(0);
            await load();
        } catch (err) {
            setStatus(`Error: ${err instanceof Error ? err.message : "upload failed"}`);
        }
        e.target.value = "";
    }

    async function handleDelete(key: string, name: string) {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setStatus(`Deleting ${name}…`);
        try {
            const res = await fetch("/api/vault/delete", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Delete failed");
            setStatus(`✓ Deleted ${name}`);
            await load(); // refresh so it disappears
        } catch (e) {
            setStatus(`Error: ${e instanceof Error ? e.message : "delete failed"}`);
        }
    }

    async function handleRename(key: string, currentName: string) {
        const newName = prompt("Rename to:", currentName);
        if (!newName || newName.trim() === currentName) return;
        setStatus(`Renaming ${currentName}…`);
        try {
            const res = await fetch("/api/vault/rename", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldKey: key, newName: newName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Rename failed");
            setStatus(`✓ Renamed to ${newName}`);
            await load();
        } catch (e) {
            setStatus(`Error: ${e instanceof Error ? e.message : "rename failed"}`);
        }
    }

    async function handleFolderDelete(folderPrefix: string, folderName: string) {
        if (!confirm(`Delete the folder "${folderName}" and everything inside it? This cannot be undone.`)) return;
        setStatus(`Deleting folder ${folderName}…`);
        try {
            const res = await fetch("/api/vault/folder/delete", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefix: folderPrefix }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Delete failed");
            setStatus(`✓ Deleted ${folderName} (${data.deleted} item${data.deleted === 1 ? "" : "s"})`);
            await load();
        } catch (e) {
            setStatus(`Error: ${e instanceof Error ? e.message : "delete failed"}`);
        }
    }

    return (
        <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
            <h1>File Vault</h1>
            <p style={{ opacity: 0.7, marginBottom: "1.5rem" }}>Backed by Garage</p>

            <div style={{ padding: "1rem", border: "1px solid #26233a", borderRadius: 8, marginBottom: "1.5rem" }}>
                <input type="file" onChange={handleUpload} />
                {progress > 0 && <div style={{ marginTop: "0.75rem" }}>Progress: {progress}%</div>}
                {status && <p style={{ marginTop: "0.75rem", opacity: 0.85 }}>{status}</p>}
                <button onClick={handleNewFolder} style={{ marginLeft: "1rem", cursor: "pointer" }}>
                    New folder
                </button>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
                <label style={{ cursor: "pointer", color: "#9ccfd8" }}>
                    Upload folder
                    <input
                        type="file"
                        onChange={handleFolderUpload}
                        // @ts-expect-error — webkitdirectory isn't in React's types but is widely supported
                        webkitdirectory=""
                        directory=""
                        multiple
                        style={{ display: "none" }}
                    />
                </label>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {crumbs(prefix).map((c, i, arr) => (
                    <span key={c.prefix} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <button
                            onClick={() => setPrefix(c.prefix)}
                            disabled={i === arr.length - 1}
                            style={{
                                background: "none", border: "none", padding: 0,
                                cursor: i === arr.length - 1 ? "default" : "pointer",
                                color: i === arr.length - 1 ? "inherit" : "#9ccfd8",
                                fontWeight: i === arr.length - 1 ? 600 : 400,
                            }}
                        >
                            {c.label}
                        </button>
                        {i < arr.length - 1 && <span style={{ opacity: 0.4 }}>/</span>}
                    </span>
                ))}
            </div>
            {loading ? (
                <p>Loading…</p>
            ) : files.length === 0 && folders.length === 0 ? (
                <p style={{ opacity: 0.7 }}>Vault is empty.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {folders.map((f) => (
                            <tr key={f.prefix} style={{ borderTop: "1px solid #26233a" }}>
                                <td style={{ padding: "0.6rem 0" }}>
                                    <button
                                        onClick={() => setPrefix(f.prefix)}
                                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#9ccfd8", fontWeight: 500 }}
                                    >
                                        📁 {f.name}
                                    </button>
                                </td>
                                <td></td>
                                <td></td>
                                <td style={{ padding: "0.6rem 0", textAlign: "right" }}>
                                    <button
                                        onClick={() => handleFolderDelete(f.prefix, f.name)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#eb6f92" }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {files.map((f) => (
                            <tr key={f.key} style={{ borderTop: "1px solid #26233a" }}>
                                <td style={{ padding: "0.6rem 0" }}>
                                    <a href={`/api/vault/download?key=${encodeURIComponent(f.key)}`} style={{ color: "#9ccfd8", textDecoration: "none" }}>
                                        📄 {f.name}
                                    </a>
                                </td>
                                <td style={{ padding: "0.6rem 0", textAlign: "right", opacity: 0.7, whiteSpace: "nowrap" }}>{formatSize(f.size)}</td>
                                <td style={{ padding: "0.6rem 0", textAlign: "right", opacity: 0.6, whiteSpace: "nowrap" }}>
                                    {f.modified ? new Date(f.modified).toLocaleDateString() : ""}
                                </td>
                                <td style={{ padding: "0.6rem 0", textAlign: "right" }}>
                                    <button
                                        onClick={() => handleRename(f.key, f.name)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ccfd8", marginRight: "0.75rem" }}
                                    >
                                        Rename
                                    </button>
                                    <button
                                        onClick={() => handleDelete(f.key, f.name)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#eb6f92" }}
                                    >
                                        Delete
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </main>
    );
}