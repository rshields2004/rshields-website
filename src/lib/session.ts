import type { SessionOptions } from "iron-session";

export interface SessionData {
    userId?: number;
    email?: string;
    isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET!,
    cookieName: "rshields_session",
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    },
};