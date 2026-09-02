"use client";

import dynamic from "next/dynamic";

const ModelConfiguratorLazy = dynamic(
  () =>
    import("@/components/configurator/model-configurator").then((mod) => ({
      default: mod.ModelConfigurator,
    })),
  {
    ssr: false,
    loading: () => <p className="p-8 text-sm">Yapılandırıcı yükleniyor.</p>,
  },
);

export function ModelConfiguratorClient() {
  return <ModelConfiguratorLazy />;
}
