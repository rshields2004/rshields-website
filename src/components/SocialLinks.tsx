/* Hand-rolled monoline icons matching the sun/moon glyphs elsewhere — no icon
   library dependency for four marks. */
function GitHubIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.93c.56.1.77-.24.77-.54v-1.9c-3.14.68-3.8-1.5-3.8-1.5-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.94.1-.73.4-1.22.72-1.5-2.51-.29-5.15-1.26-5.15-5.6 0-1.24.44-2.25 1.16-3.04-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.1 1.16a10.7 10.7 0 0 1 5.64 0c2.15-1.46 3.1-1.16 3.1-1.16.61 1.57.23 2.73.11 3.02.72.79 1.16 1.8 1.16 3.04 0 4.35-2.65 5.31-5.17 5.59.41.35.77 1.04.77 2.1v3.11c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21H18.4v-5.7c0-1.36-.02-3.1-1.9-3.1-1.9 0-2.19 1.48-2.19 3v5.8H10.4V9Z" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.24 2.5h3.3l-7.2 8.23 8.47 11.27h-6.63l-5.2-6.8-5.94 6.8H1.74l7.7-8.8L1.35 2.5h6.8l4.7 6.22 5.4-6.22Zm-1.16 17.6h1.83L7.02 4.4H5.06l12.02 15.7Z" />
        </svg>
    );
}

function EmailIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="0" />
            <path d="m3 7 9 6 9-6" />
        </svg>
    );
}

/* GitHub is real (matches this repo's own remote). LinkedIn and X are
   good-faith guesses built the same way — swap them for the real profile
   URLs. */
const LINKS = [
    { label: "GitHub", href: "https://github.com/rshields2004", icon: GitHubIcon },
    { label: "LinkedIn", href: "https://linkedin.com/in/rshields2004", icon: LinkedInIcon },
    { label: "X", href: "https://x.com/rshields2004", icon: XIcon },
    { label: "Email", href: "mailto:rshields04@outlook.com", icon: EmailIcon },
];

export default function SocialLinks() {
    return (
        <div className="social-row">
            {LINKS.map(({ label, href, icon: Icon }) => (
                <a
                    key={label}
                    href={href}
                    className="btn btn-secondary btn-sm social-btn"
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={href.startsWith("mailto:") ? undefined : "noreferrer noopener"}
                >
                    <Icon />
                    {label}
                </a>
            ))}
        </div>
    );
}
