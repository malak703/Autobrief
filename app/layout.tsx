import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TopProgressBar } from "@/components/top-progress-bar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "AutoBrief",
  description: "AI client brief management platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}