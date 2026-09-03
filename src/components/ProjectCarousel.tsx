"use client";

import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 4500;

/**
 * Auto-scrolling image carousel for a project's screenshots. Widescreen
 * (16:9) frame, crossfades between slides, pauses on hover so a still image
 * can actually be looked at, and carries an explicit play/pause toggle —
 * on by default, per the brief, rather than something a visitor has to find.
 */
export default function ProjectCarousel({
    images,
    alt,
}: {
    images: string[];
    alt: string;
}) {
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [hovering, setHovering] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const advancing = playing && !hovering && images.length > 1;
    const showPrevious = () => setIndex((current) => (current - 1 + images.length) % images.length);
    const showNext = () => setIndex((current) => (current + 1) % images.length);

    useEffect(() => {
        if (!advancing) return;
        timerRef.current = setInterval(() => {
            setIndex((i) => (i + 1) % images.length);
        }, INTERVAL_MS);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [advancing, images.length]);

    if (images.length === 0) return null;

    if (images.length === 1) {
        return (
            <div className="carousel carousel-single">
                <img src={images[0]} alt={alt} loading="lazy" />
            </div>
        );
    }

    return (
        <div
            className="carousel"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onFocusCapture={() => setHovering(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setHovering(false);
            }}
        >
            <div className="carousel-frame">
                {images.map((src, i) => (
                    <img
                        key={src}
                        src={src}
                        alt={i === index ? alt : ""}
                        aria-hidden={i === index ? undefined : true}
                        loading={i === 0 ? "eager" : "lazy"}
                        className="carousel-slide"
                        style={{ opacity: i === index ? 1 : 0 }}
                    />
                ))}

                <button
                    type="button"
                    className="carousel-control carousel-previous"
                    onClick={showPrevious}
                    aria-label="Show previous image"
                >
                    <span aria-hidden="true">&larr;</span>
                </button>

                <button
                    type="button"
                    className="carousel-control carousel-next"
                    onClick={showNext}
                    aria-label="Show next image"
                >
                    <span aria-hidden="true">&rarr;</span>
                </button>

                <button
                    type="button"
                    className="carousel-toggle"
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                    aria-pressed={playing}
                >
                    {playing ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="5" width="4" height="14" />
                            <rect x="14" y="5" width="4" height="14" />
                        </svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 5l13 7-13 7V5z" />
                        </svg>
                    )}
                </button>
            </div>

            <div className="carousel-dots">
                {images.map((src, i) => (
                    <button
                        key={src}
                        type="button"
                        className={`carousel-dot${i === index ? " is-active" : ""}`}
                        aria-label={`Show image ${i + 1} of ${images.length}`}
                        aria-current={i === index}
                        onClick={() => setIndex(i)}
                    />
                ))}
            </div>
        </div>
    );
}
