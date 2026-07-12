import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sessionOptions, type SessionData } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";

const MAX_PARTS = 10000;

export async function POST(request: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.isLoggedIn) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { filename, contentType, fileSize, partSize } = await request.json();
    console.log("create received:", { filename, fileSize, partSize, numPartsWouldBe: Math.ceil(fileSize / partSize) });

    if (!filename || !fileSize || !partSize) {
        return NextResponse.json({ error: "Missing filename, fileSize or partSize" }, { status: 400 });    
    }

    const key = String(filename).replace(/^\/+/, "");
    const numParts = Math.ceil(fileSize / partSize);
    
    if (numParts > MAX_PARTS) {
        return NextResponse.json({ error: `${numParts} parts exceeds the 10000 limit — use a larger part size.` }, { status: 400 });
    }

    const created = await s3.send(new CreateMultipartUploadCommand({
        Bucket: BUCKET, Key: key, ContentType: contentType || "application/octet-stream",
    }));

    const uploadId = created.UploadId!;

    const partUrls: {
        partNumber: number;
        url: string
    }[] = [];

    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
        const url = await getSignedUrl(
            s3,
            new UploadPartCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber}),
            {
                expiresIn: 3600
            },
        );
        partUrls.push({ partNumber, url });
    }

    return NextResponse.json({ key, uploadId, partUrls });
}