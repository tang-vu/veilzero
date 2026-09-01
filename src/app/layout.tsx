import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const body = Manrope({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "VeilZero — private coordinated disclosure",
  description: "Encrypted vulnerability reports, deadline-bound coordination, and shielded STRK20 bounty settlement.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${body.variable} ${mono.variable}`}>{children}</body></html>;
}
