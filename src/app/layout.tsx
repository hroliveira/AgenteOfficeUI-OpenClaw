import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  title: "Team Overview v3.2",
  description: "OpenClaw Agent Monitoring Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${vt323.variable} font-pixel antialiased bg-[#0b0e14] text-white overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
