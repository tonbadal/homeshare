import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { InstallPrompt } from "@/components/install-prompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SharedHome — Family Home Management",
  description:
    "Coordinate bookings, share house instructions, manage tasks, and communicate with your family.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SharedHome",
  },
  icons: {
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <InstallPrompt />
      </body>
    </html>
  );
}
