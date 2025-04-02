'use client';

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Metadata can't be exported from a Client Component
// This is now moved to separate metadata object in the metadata.ts file

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>DetectAive - AI-powered Detective Game</title>
        <meta name="description" content="Solve mysteries using your detective skills in this interactive investigation game" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
