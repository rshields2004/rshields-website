"use client";

import { useEffect, useState } from "react";

/* Icons are the old site's sun/moon glyphs, unchanged, since they are what
   the request is matching. */
function SunIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
    );
}

/**
 * The inline script in the root layout already set `[data-theme]` on <html>
 * before this ever mounts, so the colours never flash. This component only
 * has to read that attribute back (client-only — hence the mount-time read
 * rather than an initial useState) and flip it on click.
 */
export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const current = document.documentElement.getAttribute("data-theme");
        setTheme(current === "dark" ? "dark" : "light");
    }, []);

    const toggle = () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        setTheme(next);
        document.documentElement.setAttribute("data-theme", next);
        try {
            localStorage.setItem("rs-theme", next);
        } catch {
            // Private browsing etc. — the toggle still works for this visit.
        }
        // Lets the ASCII field's decorative colours follow the theme live,
        // without remounting its WebGL context.
        window.dispatchEvent(new CustomEvent("theme:change", { detail: { theme: next } }));
    };

    return (
        <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}
