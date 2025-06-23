import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ReduxProvider } from "@/components/redux-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Medical Audio Transcript Analyzer",
  description:
    "A tool for analyzing and summarizing medical consultation audio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} lg:overflow-y-hidden`}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
