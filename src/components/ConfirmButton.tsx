"use client";

import React, { useRef } from "react";
import { useDialog } from "@/components/ui/DialogProvider";

export default function ConfirmButton({
    children,
    message,
    className = "btn btn-danger btn-sm",
}: {
    children: React.ReactNode;
    message: string;
    className?: string;
}) {
    const { confirm } = useDialog();
    const ref = useRef<HTMLButtonElement>(null);

    return (
        <button
            ref={ref}
            type="button"
            className={className}
            onClick={async () => {
                const ok = await confirm(message, { danger: true, confirmText: "Delete" });
                if (ok) ref.current?.form?.requestSubmit();
            }}
        >
            {children}
        </button>
    );
}