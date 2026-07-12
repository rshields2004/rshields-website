import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { sessionOptions, type SessionData } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";

export async function POST(request: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { oldKey, newName } = await request.json();
    if (!oldKey || !newName) return NextResponse.json({ error: "Missing oldKey or newName" }, { status: 400 });
    if (/[/\\]/.test(newName)) {
        return NextResponse.json({ error: "Name can't contain slashes" }, { status: 400 });
    }

    // Keep the file in its current folder: swap only the last path segment.
    const slash = oldKey.lastIndexOf("/");
    const dir = slash === -1 ? "" : oldKey.slice(0, slash + 1);
    const newKey = `${dir}${newName}`;

    if (newKey === oldKey) return NextResponse.json({ ok: true, newKey }); // no-op

    try {
        // Refuse if something already lives at the target — don't silently overwrite
        try {
            await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: newKey }));
            return NextResponse.json({ error: `"${newName}" already exists here.` }, { status: 409 });
        } catch {
            // HeadObject throws when the target doesn't exist — which is what we want
        }

        // CopySource must be URL-encoded and include the bucket
        await s3.send(new CopyObjectCommand({
            Bucket: BUCKET,
            Key: newKey,
            CopySource: `${BUCKET}/${encodeURIComponent(oldKey)}`,
        }));
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey }));

        return NextResponse.json({ ok: true, newKey });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Rename failed" }, { status: 502 });
    }
}