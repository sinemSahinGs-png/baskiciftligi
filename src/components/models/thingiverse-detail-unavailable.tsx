import type { Route } from "next";

import {
  ContentPage,
} from "@/components/content/content-layout";
import type { ThingiverseIntegrationStatus } from "@/providers/thingiverse/status";
import { thingiverseStatusCopy } from "@/providers/thingiverse/status";

export function ThingiverseDetailUnavailable({
  externalId,
  status = "api_unavailable",
  message,
}: {
  externalId: string;
  status?: ThingiverseIntegrationStatus;
  message?: string;
}) {
  const copy = thingiverseStatusCopy[status];
  const sourceHref = `/api/hazir-modeller/source-open?kind=thingiverse&id=${encodeURIComponent(externalId)}`;

  return (
    <ContentPage
      eyebrow="Harici kaynak · Thingiverse"
      title={copy.title}
      description={message ?? copy.body}
      status={{ label: status, tone: "warning" }}
      actions={[
        {
          href: sourceHref as Route,
          label: "Thingiverse kaynak sayfasını aç",
          variant: "default",
        },
        {
          href: "/hazir-modeller",
          label: "Model kütüphanesine dönün",
          variant: "outline",
        },
      ]}
      backLink={{ href: "/hazir-modeller", label: "Hazır modeller" }}
    >
      <p className="text-sm leading-6 text-muted-light">
        Model kimliği{" "}
        <span className="font-semibold text-light-text">{externalId}</span> için
        ayrıntılar şu an yüklenemedi. Arama sonuçları etkilenmez; kaynak
        sayfasından modele doğrudan ulaşabilirsin.
      </p>
      <p className="mt-4 text-sm">
        <a href={sourceHref} className="font-semibold underline">
          Thingiverse’de görüntüle
        </a>
      </p>
    </ContentPage>
  );
}
