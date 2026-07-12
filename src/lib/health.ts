import { sql } from "drizzle-orm";
import { db } from "@/db";
import { s3, BUCKET } from "@/lib/s3";
import { HeadBucketCommand } from "@aws-sdk/client-s3";

export type ServiceStatus = {
    name: string;
    ok: boolean;
    ms: number | null;
    detail: string;
};

async function timed(name: string, fn: () => Promise<string>): Promise<ServiceStatus> {
    const start = performance.now();
    try {
        const detail = await fn();
        return {
            name,
            ok: true,
            ms: Math.round(performance.now() - start), 
            detail 
        };
    }
    catch (e) {
        return {
            name,
            ok: false,
            ms: null,
            detail: e instanceof Error ? e.message : "unreachable"
        };
    }
}

async function checkPostgres(): Promise<ServiceStatus> {
    return timed("Postgresql", async () => {
        await db.execute(sql`select 1`);
        return "connected";
    });
}

async function checkGarage(): Promise<ServiceStatus> {
    return timed("Garage (S3)", async () => {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET })); 
        return `Bucket "${BUCKET}" reachable`;
    });
}

async function checkRedis(): Promise<ServiceStatus> {
  return timed("Redis", async () => {
    // Lazy import so the app doesn't need redis wired up unless this runs
    const { createClient } = await import("redis");
    const client = createClient({ url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379" });
    client.on("error", () => {}); // suppress the library's throw-on-error so timed() handles it
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return pong; // "PONG"
  });
}


export async function checkAll(): Promise<ServiceStatus[]> {
  // Run them in parallel — one slow/down service shouldn't delay the others
  return Promise.all([checkPostgres(), checkGarage(), checkRedis()]);
}