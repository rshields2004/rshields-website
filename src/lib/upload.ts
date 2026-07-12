import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
]);
const MAX_MB = 25;
const MAX_SIZE = MAX_MB * 1024 * 1024;

export async function saveThumbnail(file: File): Promise<string> {
    const ext = ALLOWED.get(file.type);
    if (!ext) {
        throw new Error("Thumbnail must be a JPG, PNG, WebP, or GIF image.");
    }
    if (file.size > MAX_SIZE) {
        throw new Error(`Thumbnail must be under ${MAX_SIZE}MB`);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(join(process.cwd(), "public", "uploads", filename), bytes);

    return `/uploads/${filename}`;
}