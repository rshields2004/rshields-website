import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { sessionOptions, type SessionData } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";

export async function POST(request: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key, uploadId } = await request.json();
    if (!key || !uploadId) return NextResponse.json({ error: "Missing key or uploadId" }, { status: 400 });

    await s3.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId }));
    return NextResponse.json({ ok: true });
}