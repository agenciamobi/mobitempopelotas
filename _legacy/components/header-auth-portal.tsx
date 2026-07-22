"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAccountAction } from "@/components/auth-account-action";

export function HeaderAuthPortal() {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    setTarget(document.querySelector(".site-header-actions"));
  }, []);

  return target ? createPortal(<AuthAccountAction />, target) : null;
}
