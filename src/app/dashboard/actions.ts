"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { redirect } from "next/navigation";

export async function logout() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.destroy();
    redirect("/login");
}