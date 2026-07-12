"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import Modal from "./Modal";

type ConfirmOptions = { title?: string; confirmText?: string; cancelText?: string; danger?: boolean };
type PromptOptions = { title?: string; confirmText?: string; cancelText?: string; placeholder?: string };

type DialogState =
    | { kind: "confirm"; message: string; options: ConfirmOptions; resolve: (v: boolean) => void }
    | { kind: "prompt"; message: string; options: PromptOptions; resolve: (v: string | null) => void }
    | null;

type DialogContextValue = {
    confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
    promptText: (message: string, defaultValue?: string, options?: PromptOptions) => Promise<string | null>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error("useDialog must be used within DialogProvider");
    return ctx;
}

export default function DialogProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<DialogState>(null);
    const [inputValue, setInputValue] = useState("");

    const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
        return new Promise<boolean>((resolve) => {
            setState({ kind: "confirm", message, options, resolve });
        });
    }, []);

    const promptText = useCallback((message: string, defaultValue = "", options: PromptOptions = {}) => {
        setInputValue(defaultValue);
        return new Promise<string | null>((resolve) => {
            setState({ kind: "prompt", message, options, resolve });
        });
    }, []);

    function close(result: boolean | string | null) {
        if (!state) return;
        if (state.kind === "confirm") state.resolve(Boolean(result));
        else state.resolve(result as string | null);
        setState(null);
    }

    return (
        <DialogContext.Provider value={{ confirm, promptText }}>
            {children}
            {state && (
                <Modal onClose={() => close(state.kind === "confirm" ? false : null)}>
                    <div className="modal-title">
                        {state.options.title ?? (state.kind === "confirm" ? "Are you sure?" : "Enter a value")}
                    </div>
                    <div className="modal-message">{state.message}</div>
                    {state.kind === "prompt" && (
                        <input
                            autoFocus
                            className="input"
                            value={inputValue}
                            placeholder={state.options.placeholder}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") close(inputValue);
                            }}
                        />
                    )}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => close(state.kind === "confirm" ? false : null)}
                        >
                            {state.options.cancelText ?? "Cancel"}
                        </button>
                        <button
                            type="button"
                            autoFocus={state.kind === "confirm"}
                            className={state.kind === "confirm" && state.options.danger ? "btn btn-danger" : "btn btn-primary"}
                            onClick={() => close(state.kind === "confirm" ? true : inputValue)}
                        >
                            {state.options.confirmText ?? "Confirm"}
                        </button>
                    </div>
                </Modal>
            )}
        </DialogContext.Provider>
    );
}
