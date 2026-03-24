import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Lead Portal",
  description: "Lead management portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-stone-50 text-stone-900 min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <NavBar />
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
