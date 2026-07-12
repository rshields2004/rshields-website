"use client";

import { useActionState, useState } from "react";

type ProjectRow = {
    id: number;
    title: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    status: string;
    category: string | null;
    techStack: unknown;
    repoUrl: string | null;
    liveUrl: string | null;
    thumbnailPath: string | null;
    sortOrder: number;
};

type Action = (prev: unknown, formData: FormData) => Promise<{ error: string } | void>;

const field: React.CSSProperties = { display: "grid", gap: "0.25rem", marginBottom: "0.9rem" };

export default function ProjectForm({ action, project }: { action: Action; project?: ProjectRow }) {
    const [state, formAction, pending] = useActionState(action, null);

    const [title, setTitle] = useState(project?.title ?? "");
    const [slug, setSlug] = useState(project?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(Boolean(project));

    const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const techValue = Array.isArray(project?.techStack) ? (project!.techStack as string[]).join(", ") : "";

    return (
        <main style={{ maxWidth: 640, margin: "2rem auto", padding: "1rem" }}>
            <h1>{project ? "Edit project" : "New project"}</h1>

            <form action={formAction}>
                {project && <input type="hidden" name="id" value={project.id} />}

                <label style={field}>
                    <span>Title *</span>
                    <input
                        name="title"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (!slugTouched) setSlug(slugify(e.target.value));
                        }}
                        required
                    />
                </label>

                <label style={field}>
                    <span>Slug *</span>
                    <input
                        name="slug"
                        value={slug}
                        onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                        required
                    />
                </label>

                <label style={field}>
                    <span>Short description</span>
                    <input name="shortDescription" defaultValue={project?.shortDescription ?? ""} maxLength={300} />
                </label>

                <label style={field}>
                    <span>Description</span>
                    <textarea name="description" rows={5} defaultValue={project?.description ?? ""} />
                </label>

                <label style={field}>
                    <span>Status</span>
                    <select name="status" defaultValue={project?.status ?? "draft"}>
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                    </select>
                </label>

                <label style={field}>
                    <span>Category</span>
                    <input name="category" defaultValue={project?.category ?? ""} />
                </label>

                <label style={field}>
                    <span>Tech stack (comma-separated)</span>
                    <input name="techStack" defaultValue={techValue} placeholder="Next.js, TypeScript, Drizzle" />
                </label>

                <label style={field}>
                    <span>Repo URL</span>
                    <input name="repoUrl" type="url" defaultValue={project?.repoUrl ?? ""} />
                </label>

                <label style={field}>
                    <span>Live URL</span>
                    <input name="liveUrl" type="url" defaultValue={project?.liveUrl ?? ""} />
                </label>

                <label style={field}>
                    <span>Thumbnail image</span>
                    {project?.thumbnailPath && (
                        <img
                        src={project.thumbnailPath}
                        alt=""
                        style={{ maxWidth: 200, borderRadius: 6, marginBottom: "0.4rem" }}
                        />
                    )}
                    <input type="file" name="thumbnail" accept="image/jpeg,image/png,image/webp,image/gif" />
                    <input type="hidden" name="existingThumbnail" value={project?.thumbnailPath ?? ""} />
                    <small style={{ opacity: 0.6 }}>JPG, PNG, WebP or GIF, up to 5 MB. Leave empty to keep the current image.</small>
                </label>

                <label style={field}>
                    <span>Sort order</span>
                    <input name="sortOrder" type="number" defaultValue={project?.sortOrder ?? 0} />
                </label>

                {state?.error && <p style={{ color: "#eb6f92" }}>{state.error}</p>}

                <button type="submit" disabled={pending}>
                    {pending ? "Saving…" : project ? "Save changes" : "Create project"}
                </button>
            </form>
        </main>
    );
}