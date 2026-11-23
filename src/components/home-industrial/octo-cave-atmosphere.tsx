import { ATELIER_CAVE_BG } from "@/components/home-industrial/industrial-slots";

export function OctoCaveAtmosphere() {
  return (
    <div className="octo-cave-atmosphere" aria-hidden="true">
      <div
        className="octo-cave-photo"
        data-cave-photo=""
        style={{ backgroundImage: `url("${ATELIER_CAVE_BG}")` }}
      />
      <div className="octo-cave-shade" />
      <div className="octo-cave-sediment octo-cave-sediment-mid" />
      <div className="octo-cave-sediment octo-cave-sediment-fore" />
      <div className="octo-cave-warm" />
    </div>
  );
}
