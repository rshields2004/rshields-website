import { existsSync } from "node:fs";
import path from "node:path";

/** Filenames checked, in order, for the masthead portrait. */
const CANDIDATES = ["rowan.jpg", "rowan.jpeg", "rowan.png", "rowan.webp"];

/**
 * Returns the public path of the portrait if one has been dropped into
 * `public/`, else null so the masthead can render its placeholder plate.
 */
export function findPortrait(): string | null {
    for (const name of CANDIDATES) {
        if (existsSync(path.join(process.cwd(), "public", name))) return `/${name}`;
    }
    return null;
}
