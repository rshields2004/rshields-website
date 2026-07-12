import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { sessionOptions, type SessionData } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";
import { delimiter } from "path";

export async function GET(request: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    
    if (!session.isLoggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefix = request.nextUrl.searchParams.get("prefix") ?? "";

    try {
        const out = await s3.send(new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: prefix,
            Delimiter: "/",
        }));

        const folders = (out.CommonPrefixes ?? []).map((p) => ({
            name: p.Prefix!.slice(prefix.length).replace(/\/$/, ""),
            prefix: p.Prefix!,
        }));

        const files = (out.Contents ?? []).filter(
            (o) => o.Key !== prefix
        ).map(
            (o) => ({
                key: o.Key!,
                name: o.Key!.slice(prefix.length),
                size: o.Size ?? 0,
                modified: o.LastModified?.toISOString() ?? null,
            })
        );
        
        return NextResponse.json({ prefix, folders, files });
    }
    catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "List failed" }, { status: 502 });
    }

}