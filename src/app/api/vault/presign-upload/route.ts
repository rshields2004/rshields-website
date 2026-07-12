import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sessionOptions, type SessionData } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";

export async function POST(request: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType } = await request.json();
    if (!filename) {
        return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // Key = where it lands in the bucket. Prefix per-user later if you add multi-user.
    const key = String(filename).replace(/^\/+/, "");

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType || "application/octet-stream",
    });

    // URL valid for 1 hour — plenty for a large upload, short enough to not linger
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ url, key });
}