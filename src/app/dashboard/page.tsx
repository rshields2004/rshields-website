import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import Link from "next/link";
import { sessionOptions, type SessionData } from "@/lib/session";

/* Reuses the public index's entry language, so the private side reads as the
   same publication rather than a separate admin tool. */
const SECTIONS = [
    {
        href: "/dashboard/projects",
        title: "Projects",
        desc: "Create, edit and publish the entries that appear on the public index.",
        action: "Manage",
    },
    {
        href: "/dashboard/vault",
        title: "Vault",
        desc: "Browse, upload and organise files in the object store.",
        action: "Browse",
    },
    {
        href: "/dashboard/status",
        title: "Status",
        desc: "Health of the database, cache and object store behind the site.",
        action: "Check",
    },
];

export default async function Dashboard() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    return (
        <main className="page">
            <div className="page-header">
                <h1 className="page-title">Console</h1>
                <span className="page-subtitle">Signed in as {session.email}</span>
            </div>

            {SECTIONS.map((s, i) => (
                <Link key={s.href} href={s.href} className="work-entry">
                    <span className="work-no">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                        <span className="work-title">{s.title}</span>
                        <span className="work-desc">{s.desc}</span>
                    </span>
                    <dl className="work-side">
                        <div>
                            <dt>Action</dt>
                            <dd>{s.action}</dd>
                        </div>
                        <div>
                            <span className="work-go">Open &#8599;</span>
                        </div>
                    </dl>
                </Link>
            ))}
        </main>
    );
}
