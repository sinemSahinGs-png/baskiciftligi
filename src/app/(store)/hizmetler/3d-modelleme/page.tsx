import { createServiceMetadata, ServiceDetailPage } from "../service-detail";

export const metadata = createServiceMetadata("3d-modelleme");

export default function ModelingServicePage() {
  return <ServiceDetailPage slug="3d-modelleme" />;
}
