import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { sessionOptions, type SessionData } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";

export async function POST(request: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prefix } = await request.json();
    // Guard hard: a prefix MUST be non-empty and end with "/". An empty prefix would delete the whole bucket.
    if (!prefix || typeof prefix !== "string" || !prefix.endsWith("/")) {
        return NextResponse.json({ error: "Invalid folder prefix" }, { status: 400 });
    }

    try {
        let deleted = 0;
        let continuationToken: string | undefined;

        do {
            // List a page of everything under the prefix (no delimiter = includes nested subfolders' keys)
            const listed = await s3.send(new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            }));

            const objects = (listed.Contents ?? []).map((o) => ({ Key: o.Key! }));

            if (objects.length > 0) {
                // DeleteObjects handles up to 1000 keys; a single ListObjectsV2 page is <=1000, so one call per page
                await s3.send(new DeleteObjectsCommand({
                    Bucket: BUCKET,
                    Delete: { Objects: objects, Quiet: true },
                }));
                deleted += objects.length;
            }

            continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
        } while (continuationToken);

        return NextResponse.json({ ok: true, deleted });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Delete failed" }, { status: 502 });
    }
}