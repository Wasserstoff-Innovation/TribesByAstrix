import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavbarWrapper from "./NavbarWrapper";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ToastProvider } from "../../components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tribes by Astrix",
  description: "Manage your tribes and crypto communities easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="dark"
          storageKey="tribes-ui-theme"
        >
          <ToastProvider position="bottom-right">
            <div className="min-h-screen bg-white dark:bg-background-dark text-black dark:text-foreground-dark">
              <NavbarWrapper />
              <main className="pt-[var(--navbar-height)]">
                {children}
              </main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
