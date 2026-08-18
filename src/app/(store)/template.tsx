import type { ReactNode } from "react";

import { ChromaticWipe } from "@/components/motion/chromatic-wipe";

export default function StoreTemplate({ children }: { children: ReactNode }) {
  return (
    <>
      <ChromaticWipe />
      {children}
    </>
  );
}
