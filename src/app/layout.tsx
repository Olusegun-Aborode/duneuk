import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DuneUK Terminal",
  description: "On-chain data terminals for the UK crypto ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${mono.variable} font-mono antialiased`} style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
