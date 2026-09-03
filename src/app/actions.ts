"use server";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** No outbound email is configured anywhere in this project, so a submission
    is stored rather than sent — reviewable from /dashboard/messages. */
export async function submitContactMessage(_prev: unknown, formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !message) {
        return { error: "Name, email and message are all required." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: "That doesn't look like a valid email address." };
    }

    await db.insert(contactMessages).values({ name, email, message });

    return { ok: true as const };
}

export async function deleteContactMessage(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!Number.isInteger(id)) return;

    await db.delete(contactMessages).where(eq(contactMessages.id, id));
    revalidatePath("/dashboard/messages");
}
