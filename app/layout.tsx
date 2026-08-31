import type { Metadata } from "next";
import "./globals.css";
import "./interaction.css";

export const metadata: Metadata = { title: "ArtiChat — Deliver work. Keep the conversation.", description: "The secure delivery and review layer for AI-generated work." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
