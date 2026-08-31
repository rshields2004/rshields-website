import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
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

/* No global nav bar: the home page's masthead is its own header, and the
   dashboard carries its own. */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={plexMono.variable}>
            <body>
                <DialogProvider>{children}</DialogProvider>
            </body>
        </html>
    );
}
