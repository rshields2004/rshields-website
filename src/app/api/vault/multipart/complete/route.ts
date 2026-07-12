import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { sessionOptions, type SessionData } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";

export async function POST(request: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key, uploadId, parts } = await request.json();
    if (!key || !uploadId || !Array.isArray(parts)) {
        return NextResponse.json({ error: "Missing key, uploadId or parts" }, { status: 400 });
    }

    await s3.send(new CompleteMultipartUploadCommand({
        Bucket: BUCKET, Key: key, UploadId: uploadId,
        MultipartUpload: {
            Parts: parts.map(
                (p: { PartNumber: number, ETag: string }) => ({ PartNumber: p.PartNumber, ETag: p.ETag })
            ).sort(
                (a, b) => a.PartNumber - b.PartNumber
            ),
        },
    }));

    return NextResponse.json({ ok: true, key });
}