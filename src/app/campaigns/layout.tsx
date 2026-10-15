import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";

export default function CampaignsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}