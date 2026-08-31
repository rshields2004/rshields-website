"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function Modal({
    onClose,
    children,
    labelledBy,
}: {
    onClose: () => void;
    children: ReactNode;
    /** id of the element naming this dialog, for screen readers. */
    labelledBy?: string;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            className="modal-backdrop"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
                {children}
            </div>
        </div>,
        document.body
    );
}
