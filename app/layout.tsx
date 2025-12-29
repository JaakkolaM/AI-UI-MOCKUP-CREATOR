import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Renderer - Vector Canvas & AI Generation",
  description: "Create AI visualizations with vector drawing tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}




