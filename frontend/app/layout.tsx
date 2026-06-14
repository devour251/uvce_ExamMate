import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import Toaster from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "UVCE ExamMate AI — Your UVCE. Your Exams. Your AI.",
  description:
    "AI-powered exam preparation for UVCE students. PYQ intelligence, internal analysis, exam tomorrow mode, PDF study guides.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap"
        />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
