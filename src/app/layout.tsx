import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Task Manager - Speak Your Tasks",
  description: "Record voice memos and let AI automatically extract and organize your tasks",
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
