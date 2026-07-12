"use client";

import React from "react";

export default function ConfirmButton({
    children,
    message,
}: {
    children: React.ReactNode;
    message: string;
}) {
    return (
        <button
            type="submit"
            onClick={(e) => {
                if (!confirm(message)) {
                    return e.preventDefault();
                }
            }}
        >
            {children}
        </button>
    );
}