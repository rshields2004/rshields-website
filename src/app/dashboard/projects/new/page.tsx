import ProjectForm from "@/components/ProjectForm";
import { createProject } from "../actions";

export default function NewProjectPage() {
    return <ProjectForm action={createProject} />;
}