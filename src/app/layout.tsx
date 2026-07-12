import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const roboto = localFont({
    src: "./fonts/Roboto-VariableFont_wdth,wght.ttf", // match your actual filename
    variable: "--font-roboto",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Rowan Shields",
    description: "Portfolio and dashboard",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={roboto.variable}>
            <body>{children}</body>
        </html>
    );
}