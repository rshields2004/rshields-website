import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function POST(request: NextRequest) {
    let email = "";
    let password = "";
    try {
        const body = await request.json();
        email = String(body.email ?? "");
        password = String(body.password ?? "");
    }
    catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}