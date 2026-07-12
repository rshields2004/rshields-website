import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { sessionOptions, type SessionData } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";

export async function POST(request: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prefix, name } = await request.json();
    if (!name) return NextResponse.json({ error: "Missing folder name" }, { status: 400 });

    // reject slashes in the name so someone can't smuggle a nested path or escape the prefix
    if (/[/\\]/.test(name)) {
        return NextResponse.json({ error: "Folder name can't contain slashes" }, { status: 400 });
    }

    const base = String(prefix ?? "");
    const key = `${base}${name}/`; // e.g. "documents/" or "documents/drafts/"

    try {
        await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: "" }));
        return NextResponse.json({ ok: true, prefix: key });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 502 });
    }
}