import { notFound } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";
import { getProjectById } from "@/db/queries";
import { updateProject } from "../actions";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await getProjectById(Number(id));
    if (!project) notFound();
    return <ProjectForm action={updateProject} project={project} />;
}