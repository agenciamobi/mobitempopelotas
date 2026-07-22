import type { ReactNode } from "react";
import { HeaderAuthPortal } from "@/components/header-auth-portal";

export default function Template({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      {children}
      <HeaderAuthPortal />
    </>
  );
}
