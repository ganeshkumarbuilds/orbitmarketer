import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrbitMarketer | Brand Intelligence",
  description:
    "Generate brand-consistent marketing campaigns, detect duplicate assets, and evaluate campaign experiments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}