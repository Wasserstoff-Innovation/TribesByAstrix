import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootClient from "./root";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tribes by Astrix",
  description: "A decentralized community platform built on blockchain technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <RootClient>
          {children}
        </RootClient>
      </body>
    </html>
  );
}
