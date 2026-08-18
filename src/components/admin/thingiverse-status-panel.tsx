import { thingiverseStatusCopy } from "@/providers/thingiverse/status";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";
import { serverEnv } from "@/lib/env.server";

const flags = [
  ["THINGIVERSE_CLIENT_ID", Boolean(serverEnv.THINGIVERSE_CLIENT_ID)],
  ["THINGIVERSE_CLIENT_SECRET", Boolean(serverEnv.THINGIVERSE_CLIENT_SECRET)],
  ["THINGIVERSE_ACCESS_TOKEN", Boolean(serverEnv.THINGIVERSE_ACCESS_TOKEN)],
  ["THINGIVERSE_REDIRECT_URI", Boolean(serverEnv.THINGIVERSE_REDIRECT_URI)],
] as const;

export function ThingiverseStatusPanel() {
  const status = getThingiverseConfigStatus();
  const copy = thingiverseStatusCopy[status];

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-card p-6">
      <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        Thingiverse
      </p>
      <h2 className="mt-3 font-heading text-2xl font-medium">{copy.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {copy.body} Durum kodu: {status}. Sırlar tarayıcıya yazılmaz.
      </p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {flags.map(([name, present]) => (
          <li
            key={name}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm"
          >
            {name}: {present ? "tanımlı" : "yok"}
          </li>
        ))}
      </ul>
    </section>
  );
}
