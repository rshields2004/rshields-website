import { NextResponse } from "next/server";
import { getPublishedProjects } from "@/db/queries";

export async function GET() {
    return NextResponse.json({ projects: await getPublishedProjects() });
}