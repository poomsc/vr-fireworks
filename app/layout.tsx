import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VR Fireworks",
  description: "Gorgeous VR fireworks experience with camera integration",
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
