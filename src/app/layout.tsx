import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import DialogProvider from "@/components/ui/DialogProvider";
import "./globals.css";

/* One family for the whole system — display, labels and body all set in mono,
   which is what lets the index read as a single spec sheet. */
const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-plex-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Rowan Shields",
    description: "Portfolio and dashboard",
};

/* Sets [data-theme] on <html> before the first paint, so there is no flash of
   the wrong theme. `beforeInteractive` inlines this into the server HTML and
   runs it ahead of hydration — see ThemeToggle for the click-time half of
   this. Reads localStorage first, then falls back to the OS preference. */
const THEME_INIT = `
(function () {
  try {
    var stored = localStorage.getItem("rs-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

/* No global nav bar: the home page's masthead is its own header, and the
   dashboard carries its own. */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={plexMono.variable} suppressHydrationWarning>
            <head>
                <Script
                    id="theme-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{ __html: THEME_INIT }}
                />
            </head>
            <body>
                <DialogProvider>{children}</DialogProvider>
            </body>
        </html>
    );
}
