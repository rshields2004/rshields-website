"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDialog } from "@/components/ui/DialogProvider";

const PART_SIZE = 100 * 1024 * 1024;
const CONCURRENCY = 4;
const FILE_CONCURRENCY = 3;

type FileEntry = { key: string; name: string; size: number; modified: string | null };
type FolderEntry = { name: string; prefix: string };
type UploadEntry = {
    id: string;
    key: string;
    size: number;
    loaded: number;
    speed: number;
    status: "uploading" | "error";
    error?: string;
};
type ToastEntry = { id: string; message: string; error?: boolean };

function formatSize(bytes: number): string {
    if (bytes === 0) return "—";
    const u = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function formatSpeed(bytesPerSec: number): string {
    if (!bytesPerSec || bytesPerSec <= 0) return "";
    const u = ["B", "KB", "MB", "GB"];
    let v = bytesPerSec;
    let i = 0;
    while (v >= 1024 && i < u.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}/s`;
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

function xhrUpload(url: string, body: Blob, contentType: string | undefined, onProgress: (loaded: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        if (contentType) xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded);
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.getResponseHeader("ETag") ?? "");
            else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(body);
    });
}

// Reports loaded bytes immediately (for the progress bar) but only recomputes
// the smoothed speed estimate every ~150ms so the number doesn't jitter.
function makeProgressTracker(onUpdate: (loaded: number, speed: number) => void) {
    let lastTime = performance.now();
    let lastLoaded = 0;
    let smoothedSpeed = 0;
    return (loaded: number) => {
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        if (dt > 0.15) {
            const instSpeed = (loaded - lastLoaded) / dt;
            smoothedSpeed = smoothedSpeed === 0 ? instSpeed : smoothedSpeed * 0.7 + instSpeed * 0.3;
            lastTime = now;
            lastLoaded = loaded;
        }
        onUpdate(loaded, Math.max(0, smoothedSpeed));
    };
}

export default function VaultPage() {
    const { confirm, promptText } = useDialog();

    const [files, setFiles] = useState<FileEntry[]>([]);
    const [folders, setFolders] = useState<FolderEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [prefix, setPrefix] = useState(""); // "" = root; "documents/" = inside that folder
    const [uploads, setUploads] = useState<Record<string, UploadEntry>>({});
    const [toasts, setToasts] = useState<ToastEntry[]>([]);

    const refreshTimer = useRef<number | null>(null);

    const pushToast = useCallback((message: string, error = false) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, error }]);
        window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/vault/list?prefix=${encodeURIComponent(prefix)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "List failed");
            setFiles(data.files);
            setFolders(data.folders);
        } catch (e) {
            pushToast(e instanceof Error ? e.message : "Failed to list files", true);
        } finally {
            setLoading(false);
        }
    }, [prefix, pushToast]);

    useEffect(() => { load(); }, [load]);

    const scheduleRefresh = useCallback(() => {
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(() => { load(); }, 400);
    }, [load]);

    const updateUpload = useCallback((id: string, patch: Partial<UploadEntry>) => {
        setUploads((prev) => {
            const cur = prev[id];
            if (!cur) return prev;
            return { ...prev, [id]: { ...cur, ...patch } };
        });
    }, []);

    const removeUpload = useCallback((id: string) => {
        setUploads((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    async function uploadSmall(file: File, key: string, track: (loaded: number) => void) {
        const res = await fetch("/api/vault/presign-upload", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: key, contentType: file.type }),
        });
        const { url, error } = await res.json();
        if (error) throw new Error(error);
        await xhrUpload(url, file, file.type || "application/octet-stream", track);
    }

    async function uploadMultipart(file: File, key: string, track: (loaded: number) => void) {
        const initRes = await fetch("/api/vault/multipart/create", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: key, contentType: file.type, fileSize: file.size, partSize: PART_SIZE }),
        });
        const init = await initRes.json();
        if (init.error) throw new Error(init.error);
        const { uploadId, partUrls } = init as { key: string; uploadId: string; partUrls: { partNumber: number; url: string }[] };

        try {
            const parts: { PartNumber: number; ETag: string }[] = new Array(partUrls.length);
            const partsLoaded: number[] = new Array(partUrls.length).fill(0);
            let cursor = 0;
            const reportTotal = () => track(partsLoaded.reduce((a, b) => a + b, 0));

            async function worker() {
                while (cursor < partUrls.length) {
                    const idx = cursor++;
                    const { partNumber, url } = partUrls[idx];
                    const start = (partNumber - 1) * PART_SIZE;
                    const blob = file.slice(start, start + PART_SIZE);
                    const etag = await xhrUpload(url, blob, undefined, (loaded) => {
                        partsLoaded[idx] = loaded;
                        reportTotal();
                    });
                    if (!etag) throw new Error(`Part ${partNumber}: no ETag`);
                    parts[idx] = { PartNumber: partNumber, ETag: etag };
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

    async function startUploads(items: { file: File; key: string }[]) {
        if (items.length === 0) return;
        const ids = items.map(() => crypto.randomUUID());
        setUploads((prev) => {
            const next = { ...prev };
            items.forEach((it, i) => {
                next[ids[i]] = { id: ids[i], key: it.key, size: it.file.size, loaded: 0, speed: 0, status: "uploading" };
            });
            return next;
        });

        let cursor = 0;
        async function worker() {
            while (cursor < items.length) {
                const idx = cursor++;
                const { file, key } = items[idx];
                const id = ids[idx];
                const track = makeProgressTracker((loaded, speed) => updateUpload(id, { loaded, speed }));
                try {
                    if (file.size > PART_SIZE) await uploadMultipart(file, key, track);
                    else await uploadSmall(file, key, track);
                    updateUpload(id, { loaded: file.size, speed: 0 });
                    scheduleRefresh();
                    window.setTimeout(() => removeUpload(id), 500);
                } catch (e) {
                    updateUpload(id, { status: "error", error: e instanceof Error ? e.message : "Upload failed" });
                    pushToast(`Failed to upload ${key.slice(prefix.length)}`, true);
                }
            }
        }
        await Promise.all(Array.from({ length: Math.min(FILE_CONCURRENCY, items.length) }, worker));
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files;
        if (!list || list.length === 0) return;
        const items = Array.from(list).map((file) => ({ file, key: prefix + file.name }));
        e.target.value = "";
        await startUploads(items);
    }

    async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files;
        if (!list || list.length === 0) return;
        const items = Array.from(list).map((file) => {
            const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
            return { file, key: prefix + rel };
        });
        e.target.value = "";
        await startUploads(items);
    }

    async function handleNewFolder() {
        const name = await promptText("Choose a name for the new folder.", "", {
            title: "New folder", confirmText: "Create", placeholder: "folder-name",
        });
        if (!name || !name.trim()) return;
        try {
            const res = await fetch("/api/vault/folder", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefix, name: name.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Create failed");
            await load();
        } catch (e) {
            pushToast(e instanceof Error ? e.message : "Failed to create folder", true);
        }
    }

    async function handleDelete(key: string, name: string) {
        const ok = await confirm(`Delete "${name}"? This cannot be undone.`, {
            title: "Delete file", confirmText: "Delete", danger: true,
        });
        if (!ok) return;
        try {
            const res = await fetch("/api/vault/delete", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Delete failed");
            await load();
        } catch (e) {
            pushToast(e instanceof Error ? e.message : "Failed to delete file", true);
        }
    }

    async function handleRename(key: string, currentName: string) {
        const newName = await promptText("Enter a new name.", currentName, { title: "Rename", confirmText: "Rename" });
        if (!newName || !newName.trim() || newName.trim() === currentName) return;
        try {
            const res = await fetch("/api/vault/rename", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldKey: key, newName: newName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Rename failed");
            await load();
        } catch (e) {
            pushToast(e instanceof Error ? e.message : "Failed to rename", true);
        }
    }

    async function handleFolderDelete(folderPrefix: string, folderName: string) {
        const ok = await confirm(`Delete the folder "${folderName}" and everything inside it? This cannot be undone.`, {
            title: "Delete folder", confirmText: "Delete", danger: true,
        });
        if (!ok) return;
        try {
            const res = await fetch("/api/vault/folder/delete", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefix: folderPrefix }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Delete failed");
            await load();
        } catch (e) {
            pushToast(e instanceof Error ? e.message : "Failed to delete folder", true);
        }
    }

    const visibleUploads = Object.values(uploads).filter(
        (u) => u.key.startsWith(prefix) && !files.some((f) => f.key === u.key)
    );

    return (
        <main className="page">
            <h1 className="page-title">File vault</h1>
            <p className="page-subtitle" style={{ marginTop: 0 }}>Backed by Garage</p>

            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
                    Upload files
                    <input type="file" multiple onChange={handleFileSelect} style={{ display: "none" }} />
                </label>
                <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                    Upload folder
                    <input
                        type="file"
                        multiple
                        onChange={handleFolderSelect}
                        // @ts-expect-error — webkitdirectory isn't in React's types but is widely supported
                        webkitdirectory=""
                        directory=""
                        style={{ display: "none" }}
                    />
                </label>
                <button onClick={handleNewFolder} className="btn btn-ghost btn-sm">
                    + New folder
                </button>
            </div>

            <div className="crumbs">
                {crumbs(prefix).map((c, i, arr) => (
                    <span key={c.prefix} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <button className="crumb-btn" onClick={() => setPrefix(c.prefix)} disabled={i === arr.length - 1}>
                            {c.label}
                        </button>
                        {i < arr.length - 1 && <span className="crumb-sep">/</span>}
                    </span>
                ))}
            </div>

            {loading && files.length === 0 && folders.length === 0 && visibleUploads.length === 0 ? (
                <p className="hint">Loading…</p>
            ) : files.length === 0 && folders.length === 0 && visibleUploads.length === 0 ? (
                <p className="hint">Vault is empty.</p>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <table className="table">
                        <tbody>
                            {folders.map((f) => (
                                <tr key={f.prefix}>
                                    <td style={{ paddingLeft: "1.1rem" }}>
                                        <button
                                            onClick={() => setPrefix(f.prefix)}
                                            className="crumb-btn"
                                            style={{ fontWeight: 500 }}
                                        >
                                            📁 {f.name}
                                        </button>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td style={{ textAlign: "right", paddingRight: "1.1rem" }}>
                                        <button
                                            onClick={() => handleFolderDelete(f.prefix, f.name)}
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: "var(--love)" }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {visibleUploads.map((u) => {
                                const relName = u.key.slice(prefix.length);
                                const pct = u.size ? Math.min(100, Math.round((u.loaded / u.size) * 100)) : 0;
                                return (
                                    <tr key={u.id} className="row-pending">
                                        <td style={{ paddingLeft: "1.1rem" }} className="row-name">
                                            📄 {relName}
                                        </td>
                                        <td colSpan={2}>
                                            <div className="upload-meta">
                                                <div className="progress-track" style={{ flex: 1, minWidth: "60px" }}>
                                                    <div
                                                        className={`progress-fill ${u.status === "error" ? "is-error" : ""}`}
                                                        style={{ width: `${u.status === "error" ? 100 : pct}%` }}
                                                    />
                                                </div>
                                                <span>
                                                    {u.status === "error"
                                                        ? "Failed"
                                                        : `${pct}%${u.speed > 0 ? ` · ${formatSpeed(u.speed)}` : ""}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: "right", paddingRight: "1.1rem" }}>
                                            {u.status === "error" && (
                                                <button className="btn btn-ghost btn-sm" onClick={() => removeUpload(u.id)}>
                                                    Dismiss
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {files.map((f) => (
                                <tr key={f.key}>
                                    <td style={{ paddingLeft: "1.1rem" }}>
                                        <a href={`/api/vault/download?key=${encodeURIComponent(f.key)}`}>📄 {f.name}</a>
                                    </td>
                                    <td style={{ textAlign: "right", color: "var(--subtle)", whiteSpace: "nowrap" }}>
                                        {formatSize(f.size)}
                                    </td>
                                    <td style={{ textAlign: "right", color: "var(--muted)", whiteSpace: "nowrap" }}>
                                        {f.modified ? new Date(f.modified).toLocaleDateString() : ""}
                                    </td>
                                    <td style={{ textAlign: "right", paddingRight: "1.1rem" }}>
                                        <button onClick={() => handleRename(f.key, f.name)} className="btn btn-ghost btn-sm" style={{ marginRight: "0.4rem" }}>
                                            Rename
                                        </button>
                                        <button onClick={() => handleDelete(f.key, f.name)} className="btn btn-ghost btn-sm" style={{ color: "var(--love)" }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {toasts.length > 0 && (
                <div className="toast-stack">
                    {toasts.map((t) => (
                        <div key={t.id} className={`toast ${t.error ? "is-error" : ""}`}>
                            {t.message}
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
