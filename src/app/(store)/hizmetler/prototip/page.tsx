import { createServiceMetadata, ServiceDetailPage } from "../service-detail";

export const metadata = createServiceMetadata("prototip");

export default function PrototypeServicePage() {
  return <ServiceDetailPage slug="prototip" />;
}
