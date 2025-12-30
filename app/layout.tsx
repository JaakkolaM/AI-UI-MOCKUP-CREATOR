import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI UI Mockup Creator - Vector Canvas & AI Generation",
  description: "Create UI mockups with vector drawing tools",
  icons: {
    icon: '/AI-UI.ico',
  },
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




