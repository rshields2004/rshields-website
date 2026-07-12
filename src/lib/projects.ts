export type ProjectStatus = "draft" | "published";

export function slugify(s: string): string {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export type ProjectInput = {
    title: string;
    slug: string;
    status: ProjectStatus;
    shortDescription: string | null;
    description: string | null;
    category: string | null;
    repoUrl: string | null;
    liveUrl: string | null;
    techStack: string[];
    sortOrder: number;
};

// Only keys actually present in `body` are set — lets PATCH treat "absent" as "keep existing".
export function normalizeProjectInput(body: Record<string, unknown>): Partial<ProjectInput> {
    const out: Partial<ProjectInput> = {};
    const str = (v: unknown): string | null => {
        const t = String(v ?? "").trim();
        return t === "" ? null : t;
    };

    if ("title" in body) out.title = String(body.title ?? "").trim();
    if ("slug" in body) out.slug = String(body.slug ?? "").trim();
    if ("status" in body) out.status = String(body.status ?? "draft") as ProjectStatus;
    if ("shortDescription" in body) out.shortDescription = str(body.shortDescription);
    if ("description" in body) out.description = str(body.description);
    if ("category" in body) out.category = str(body.category);
    if ("repoUrl" in body) out.repoUrl = str(body.repoUrl);
    if ("liveUrl" in body) out.liveUrl = str(body.liveUrl);
    if ("sortOrder" in body) out.sortOrder = Number(body.sortOrder) || 0;
    if ("techStack" in body) {
        const t = body.techStack;
        out.techStack = Array.isArray(t)
            ? t.map((x) => String(x).trim()).filter(Boolean)
            : typeof t === "string"
                ? t.split(",").map((x) => x.trim()).filter(Boolean)
                : [];
    }
    return out;
}

export function validateProject(d: Partial<ProjectInput>): string | null {
    if (!d.title) return "Title is required.";
    if (!d.slug) return "Slug is required (or give a title to derive one).";
    if (d.status !== "draft" && d.status !== "published") return "Invalid status.";
    return null;
}