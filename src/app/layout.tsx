import type { Metadata } from "next";
import "./globals.css";
import "./font-fallbacks.css";

export const metadata: Metadata = {
  title: "VeilZero — private coordinated disclosure",
  description: "Encrypted vulnerability reports, deadline-bound coordination, and shielded STRK20 bounty settlement.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
