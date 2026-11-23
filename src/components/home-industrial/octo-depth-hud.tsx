const STOPS = [
  { id: "surface", label: "YÜZEY" },
  { id: "atelier", label: "ATÖLYE" },
  { id: "collection", label: "KOLEKSİYON" },
  { id: "floor", label: "DİP" },
] as const;

export function OctoDepthHud() {
  return (
    <aside className="octo-depth-hud" aria-label="Derinlik göstergesi">
      <p className="octo-depth-value" data-octo-depth-value="">
        0 M
      </p>
      <ol className="octo-depth-stops">
        {STOPS.map((stop) => (
          <li key={stop.id} data-depth-stop={stop.id}>
            {stop.label}
          </li>
        ))}
      </ol>
    </aside>
  );
}
