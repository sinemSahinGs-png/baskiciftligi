import type { ReactNode } from "react";

import { ATELIER_CAVE_BG } from "@/components/home-industrial/industrial-slots";

export function AtelierCave({ children }: { children: ReactNode }) {
  return (
    <div className="atelier-cave">
      <div
        className="atelier-cave-plate"
        aria-hidden="true"
        style={{ backgroundImage: `url("${ATELIER_CAVE_BG}")` }}
      />
      <div className="atelier-cave-copy">{children}</div>
    </div>
  );
}
