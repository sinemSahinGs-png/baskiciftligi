export function OceanAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <div className="octo-caustics" />
      <div className="octo-fog" />
      <div className="octo-currents" />
    </div>
  );
}
