"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sessionOptions, type SessionData } from "@/lib/session";
import { redirect } from "next/navigation";

export async function login(_prev: unknown, formData: FormData) {

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return { error: "Invalid email or password" };
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    redirect("/dashboard");
}
