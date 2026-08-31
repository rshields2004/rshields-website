"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RAMP, makeGlyphAtlas, asciiVertex, asciiFragment } from "./ascii";

/* ---------------------------------------------------------------------------
   3D ASCII background.

   A lit, drifting terrain is rendered in perspective to an off-screen target
   sized one texel per character cell; a fullscreen pass then swaps each cell
   for a mono glyph whose density matches that cell's brightness. So the relief
   really is 3D — the glyphs are shading a surface, not a flat pattern.

   Runs on its own. Project rows still send ripples across the terrain, and
   scrolling swings the camera down over it.
   --------------------------------------------------------------------------- */

/* Tuning ------------------------------------------------------------------ */
const CELL_PX = 12; // character cell in CSS px (10 on small screens)
const CELL_PX_SM = 10;
const AMP = 4.6; // terrain height
const DRIFT = 1.9; // world units per second the terrain slides past
const MAX_RIPPLES = 4;
const BASE_ALPHA = 0.55; // resting ink alpha for the glyphs

const INK = new THREE.Color("#9b9797"); // redacted grey — the unhighlighted field
const ACCENT = new THREE.Color("#0b5e8a"); // crests take trace blue

const SCENE_VERT = /* glsl */ `
  uniform float uTime;
  uniform vec3  uLight;
  uniform vec4  uRipples[${MAX_RIPPLES}];

  varying float vShade;

  const float AMP = ${AMP.toFixed(2)};

  float hills(vec2 p, float t) {
    float z = 0.0;
    z +=        sin(p.x * 0.16 + t * 0.22) * cos(p.y * 0.13 - t * 0.17);
    z += 0.55 * sin((p.x * 0.71 + p.y * 0.70) * 0.21 - t * 0.28);
    z += 0.30 * cos((p.x * 0.62 - p.y * 0.78) * 0.34 + t * 0.24);
    z += 0.15 * sin((p.x * 0.30 + p.y * 0.95) * 0.60 + t * 0.40);
    return z;
  }

  float ripples(vec2 p) {
    float z = 0.0;
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w <= 0.0) continue;
      float age = uTime - r.z;
      if (age < 0.0 || age > 2.6) continue;
      float gap = distance(p, r.xy) - age * 14.0;
      z += exp(-(gap * gap) / 4.0) * r.w * (1.0 - age / 2.6);
    }
    return z;
  }

  float height(vec2 p) {
    return hills(p, uTime) * AMP + ripples(p);
  }

  void main() {
    /* Slide the sample point rather than the mesh, so the terrain is endless
       without the camera ever running off the plane. */
    vec2 p = position.xy + vec2(0.0, uTime * ${DRIFT.toFixed(2)});

    float h = height(p);

    /* Central differences give a normal without an analytic derivative of the
       warped field. */
    float e = 0.7;
    float dx = (height(p + vec2(e, 0.0)) - height(p - vec2(e, 0.0))) / (2.0 * e);
    float dy = (height(p + vec2(0.0, e)) - height(p - vec2(0.0, e))) / (2.0 * e);
    vec3 n = normalize(normalMatrix * normalize(vec3(-dx, -dy, 1.0)));

    vec4 mv = modelViewMatrix * vec4(position.x, position.y, h, 1.0);

    float lambert = clamp(dot(n, normalize(uLight)), 0.0, 1.0);

    /* Expand the lambert range across the whole ramp. With only twelve glyph
       levels, an unstretched dot product lands in three or four of them and
       the relief reads as flat dither. */
    float shade = smoothstep(0.18, 0.82, lambert);

    /* Depth is a hint only. Letting it drive the value made the whole frame a
       smooth near-to-far ramp that swamped the hills. */
    float depth = clamp(1.0 - (-mv.z - 12.0) / 110.0, 0.0, 1.0);

    vShade = clamp(shade * mix(0.62, 1.0, depth), 0.0, 1.0);

    gl_Position = projectionMatrix * mv;
  }
`;

const SCENE_FRAG = /* glsl */ `
  precision mediump float;
  varying float vShade;
  void main() {
    gl_FragColor = vec4(vec3(vShade), 1.0);
  }
`;

export default function AsciiField() {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        } catch {
            return; // No WebGL — the page stands on its own without this layer.
        }
        if (!renderer.getContext()) return;

        renderer.setClearAlpha(0);
        host.appendChild(renderer.domElement);

        let disposed = false;

        /* Scene ------------------------------------------------------------- */
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 260);

        const ripples = Array.from(
            { length: MAX_RIPPLES },
            () => new THREE.Vector4(0, 0, 0, 0),
        );
        const sceneUniforms = {
            uTime: { value: 0 },
            uLight: { value: new THREE.Vector3(-0.45, 0.35, 0.82) },
            uRipples: { value: ripples },
        };

        const terrain = new THREE.Mesh(
            new THREE.PlaneGeometry(150, 130, 220, 190),
            new THREE.ShaderMaterial({
                uniforms: sceneUniforms,
                vertexShader: SCENE_VERT,
                fragmentShader: SCENE_FRAG,
            }),
        );
        terrain.rotation.x = -Math.PI / 2; // flat; the camera looks down on it
        scene.add(terrain);

        /* ASCII pass --------------------------------------------------------- */
        const target = new THREE.WebGLRenderTarget(2, 2, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            depthBuffer: true,
        });

        const asciiUniforms = {
            uScene: { value: target.texture },
            uGlyphs: { value: null as THREE.Texture | null },
            uRes: { value: new THREE.Vector2(1, 1) },
            uGrid: { value: new THREE.Vector2(1, 1) },
            uCell: { value: CELL_PX },
            uCount: { value: RAMP.length },
            uBase: { value: BASE_ALPHA },
            uInk: { value: INK },
            uAccent: { value: ACCENT },
        };

        const asciiScene = new THREE.Scene();
        const asciiCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const asciiMat = new THREE.ShaderMaterial({
            uniforms: asciiUniforms,
            vertexShader: asciiVertex,
            fragmentShader: asciiFragment,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        asciiScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), asciiMat));

        makeGlyphAtlas().then((tex) => {
            if (disposed) tex.dispose();
            else asciiUniforms.uGlyphs.value = tex;
        });

        /* Sizing ------------------------------------------------------------- */
        let cols = 1;
        let rows = 1;

        const resize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const dpr = Math.min(window.devicePixelRatio, 2);
            const cellCss = w < 720 ? CELL_PX_SM : CELL_PX;

            renderer.setPixelRatio(dpr);
            renderer.setSize(w, h, false);

            cols = Math.max(2, Math.ceil(w / cellCss));
            rows = Math.max(2, Math.ceil(h / cellCss));
            target.setSize(cols, rows);

            camera.aspect = w / h;
            camera.updateProjectionMatrix();

            asciiUniforms.uRes.value.set(w * dpr, h * dpr);
            asciiUniforms.uGrid.value.set(cols, rows);
            asciiUniforms.uCell.value = cellCss * dpr;
        };
        resize();
        window.addEventListener("resize", resize);

        /* Ripples ------------------------------------------------------------ */
        let ripplePtr = 0;
        const onRipple = (e: Event) => {
            const d = (e as CustomEvent<{ x: number; y: number; strength?: number }>)
                .detail;
            if (!d) return;
            /* Map the screen point loosely onto the terrain plane; exactness is
               not worth a raycast for a background flourish. */
            const nx = (d.x / window.innerWidth) * 2 - 1;
            const ny = -((d.y / window.innerHeight) * 2 - 1);
            ripples[ripplePtr].set(
                nx * 42,
                ny * 34 - sceneUniforms.uTime.value * DRIFT,
                sceneUniforms.uTime.value,
                d.strength ?? 1.8,
            );
            ripplePtr = (ripplePtr + 1) % MAX_RIPPLES;
        };
        window.addEventListener("field:ripple", onRipple as EventListener);

        /* Scroll swings the camera down over the terrain. -------------------- */
        let camTarget = 0;
        let camEase = 0;
        const onScroll = () => {
            const span = document.documentElement.scrollHeight - window.innerHeight;
            camTarget = span > 40 ? Math.min(window.scrollY / span, 1) : 0;
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        /* Loop --------------------------------------------------------------- */
        const timer = new THREE.Timer();
        timer.connect(document);
        let raf = 0;
        let running = true;

        const tick = () => {
            raf = requestAnimationFrame(tick);
            if (!running) return;

            if (!reduced) {
                timer.update();
                sceneUniforms.uTime.value = timer.getElapsed();
            } else {
                sceneUniforms.uTime.value = 8.0;
            }

            camEase += (camTarget - camEase) * 0.06;
            camera.position.set(0, 40 - camEase * 12, 20 - camEase * 8);
            camera.lookAt(0, 0, -6);

            renderer.setRenderTarget(target);
            renderer.render(scene, camera);
            renderer.setRenderTarget(null);
            renderer.render(asciiScene, asciiCam);
        };
        tick();

        const onVisibility = () => {
            running = document.visibilityState === "visible";
        };
        document.addEventListener("visibilitychange", onVisibility);

        /* Teardown ------------------------------------------------------------ */
        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            window.removeEventListener("field:ripple", onRipple as EventListener);
            window.removeEventListener("scroll", onScroll);
            document.removeEventListener("visibilitychange", onVisibility);
            timer.disconnect();
            timer.dispose();
            asciiUniforms.uGlyphs.value?.dispose();
            target.dispose();
            terrain.geometry.dispose();
            (terrain.material as THREE.Material).dispose();
            asciiMat.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === host) {
                host.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={hostRef} className="field-stage" aria-hidden="true" />;
}
