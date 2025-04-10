import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navigation/Navbar";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Canvass Coach",
  description: "Training scenarios for canvassing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} light`}>
<body className="antialiased bg-white text-gray-900 flex flex-col h-screen">
<Navbar />
  <main className="flex-1 overflow-y-auto">
    {children}
  </main>
  <Analytics />
</body>
    </html>
  );
}
