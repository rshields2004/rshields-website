"use client";

import type { ReactNode } from "react";

/** Hovering an entry sends a ripple across the lattice from its position. */
export default function IndexRow({
    href,
    className,
    children,
    style,
}: {
    href?: string;
    className: string;
    children: ReactNode;
    style?: React.CSSProperties;
}) {
    const ripple = (e: React.MouseEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        window.dispatchEvent(
            new CustomEvent("field:ripple", {
                detail: { x: r.left + r.width * 0.18, y: r.top + r.height / 2, strength: 1.6 },
            }),
        );
    };

    if (!href) {
        return (
            <div className={className} style={style} onMouseEnter={ripple}>
                {children}
            </div>
        );
    }

    return (
        <a
            className={className}
            style={style}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            onMouseEnter={ripple}
        >
            {children}
        </a>
    );
}
