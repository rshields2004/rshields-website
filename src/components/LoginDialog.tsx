"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import LoginForm from "@/components/LoginForm";

export default function LoginDialog() {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    /* Send focus back to the button that opened the dialog, so keyboard users
       are not dropped at the top of the document on close. */
    const close = useCallback(() => {
        setOpen(false);
        triggerRef.current?.focus();
    }, []);

    /* The page behind a modal shouldn't scroll under it. */
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="btn btn-secondary btn-sm"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(true)}
            >
                Login
            </button>

            {open && (
                <Modal onClose={close} labelledBy="login-dialog-title">
                    <div className="modal-title" id="login-dialog-title">
                        Sign in
                    </div>
                    <LoginForm autoFocus onCancel={close} />
                </Modal>
            )}
        </>
    );
}
