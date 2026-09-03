"use client";

import { useState } from "react";
import ProjectCarousel from "@/components/ProjectCarousel";

type FeaturedProjectCardProps = {
    title: string;
    shortDescription: string | null;
    description: string | null;
    techStack: string[];
    images: string[];
    liveUrl: string | null;
    repoUrl: string | null;
    published: number | null;
    reversed: boolean;
    style: React.CSSProperties;
};

export default function FeaturedProjectCard({
    title,
    shortDescription,
    description,
    techStack,
    images,
    liveUrl,
    repoUrl,
    published,
    reversed,
    style,
}: FeaturedProjectCardProps) {
    const [expanded, setExpanded] = useState(false);
    const href = liveUrl || repoUrl;

    const toggle = () => setExpanded((current) => !current);
    const isInteractiveChild = (target: EventTarget | null) =>
        target instanceof Element && Boolean(target.closest("a, button, input, select, textarea"));

    return (
        <article
            className={`project-card rise${reversed ? " project-card-reversed" : ""}${expanded ? " is-expanded" : ""}`}
            style={style}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            onClick={(event) => {
                if (!isInteractiveChild(event.target)) toggle();
            }}
            onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    toggle();
                }
            }}
        >
            <div className="project-media">
                {images.length > 0 ? (
                    <ProjectCarousel images={images} alt={title} />
                ) : (
                    <span className="project-media-empty">No image</span>
                )}
            </div>
            <div className="project-content">
                <span className="label">Featured project</span>
                <h2 className="work-title">{title}</h2>
                {shortDescription && <p className="work-desc">{shortDescription}</p>}
                {techStack.length > 0 && (
                    <span className="project-stack">
                        {techStack.map((technology) => (
                            <span key={technology}>{technology}</span>
                        ))}
                    </span>
                )}
                <span className="project-expand">{expanded ? "Hide details" : "View details"}</span>
                {published && <span className="project-year">{published}</span>}
            </div>
            {expanded && (
                <div className="project-details">
                    {description ? <p>{description}</p> : <p>No additional project description is available.</p>}
                    {href && (
                        <a href={href} target="_blank" rel="noreferrer noopener" className="work-go">
                            {liveUrl ? "Visit project" : "View source"} &#8599;
                        </a>
                    )}
                </div>
            )}
        </article>
    );
}
