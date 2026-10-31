import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal RAG Assistant",
  description: "Private document assistant with verifiable citations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}

