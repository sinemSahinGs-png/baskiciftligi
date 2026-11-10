import "./octo-sand-hero.css";

const HANDOFF_SRC = "/images/atmosphere/octo-sand-to-abyss-handoff.webp";

export function SandAbyssHandoff() {
  return (
    <div className="octo-sand-abyss" data-sand-abyss-handoff="" aria-hidden="true">
      <div className="octo-sand-abyss-frame">
        <img
          className="octo-sand-abyss-image"
          src={HANDOFF_SRC}
          alt=""
          width={2400}
          height={900}
          decoding="async"
        />
      </div>
    </div>
  );
}
