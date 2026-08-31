import * as THREE from "three";

/**
 * ASCII post-pass.
 *
 * The 3D scene is rendered to a render target with one texel per character
 * cell; a fullscreen quad then maps each cell's luminance to a glyph from an
 * atlas drawn at runtime in the site's own mono face. Scene space is luminance
 * space — the scene renders lit geometry on black, and brighter (more lit)
 * areas resolve into denser glyphs.
 *
 * Output is transparent rather than opaque, so the page's paper shows through
 * and only the glyphs are painted.
 */

/** Sparse to dense. Index 0 is blank, so unlit areas draw nothing. */
export const RAMP = " .·:;=+*x#%@";

/** next/font generates a hashed family name, so read it rather than guessing. */
function monoFamily(): string {
    const fallback = `ui-monospace, SFMono-Regular, Menlo, monospace`;
    try {
        const v = getComputedStyle(document.documentElement)
            .getPropertyValue("--font-plex-mono")
            .trim();
        return v ? `${v}, ${fallback}` : `"IBM Plex Mono", ${fallback}`;
    } catch {
        return fallback;
    }
}

export async function makeGlyphAtlas(): Promise<THREE.Texture> {
    const cell = 64;
    const n = RAMP.length;
    const family = monoFamily();

    try {
        await document.fonts.load(`700 ${cell}px ${family}`);
        await document.fonts.ready;
    } catch {
        // Fallback stack still renders something monospaced.
    }

    const cv = document.createElement("canvas");
    cv.width = n * cell;
    cv.height = cell;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(cell * 0.78)}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
        ctx.fillText(RAMP[i], i * cell + cell / 2, cell / 2 + 2);
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
}

export const asciiVertex = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

export const asciiFragment = /* glsl */ `
    precision highp float;

    uniform sampler2D uScene;
    uniform sampler2D uGlyphs;
    uniform vec2  uRes;    /* drawing-buffer px */
    uniform vec2  uGrid;   /* character columns / rows */
    uniform float uCell;   /* cell size in drawing-buffer px */
    uniform float uCount;  /* glyphs in the ramp */
    uniform float uBase;   /* resting ink alpha */
    uniform vec3  uInk;
    uniform vec3  uAccent;

    varying vec2 vUv;

    void main() {
        vec2 px = vUv * uRes;
        vec2 cellIx = floor(px / uCell);
        vec2 sceneUv = (cellIx + 0.5) / uGrid;

        vec3 c = texture2D(uScene, sceneUv).rgb;
        float l = clamp(dot(c, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);

        /* Pick a glyph, then sample it at this pixel's position within the cell. */
        float idx = floor(l * (uCount - 1.0) + 0.5);
        vec2 intra = fract(px / uCell);
        float glyph = texture2D(uGlyphs, vec2((idx + intra.x) / uCount, intra.y)).r;

        /* The brightest cells — the crests — take the accent. */
        vec3 ink = mix(uInk, uAccent, smoothstep(0.62, 0.95, l));

        /* step() keeps the blank ramp slot genuinely blank. */
        float a = glyph * uBase * step(0.5, idx);

        gl_FragColor = vec4(ink, a);
    }
`;
