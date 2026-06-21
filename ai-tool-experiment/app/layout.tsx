import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Powered Event Traffic Management System",
  description: "Predict traffic impact and receive deployment recommendations"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
