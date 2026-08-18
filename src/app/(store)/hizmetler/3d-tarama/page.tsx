import { createServiceMetadata, ServiceDetailPage } from "../service-detail";

export const metadata = createServiceMetadata("3d-tarama");

export default function ScanningServicePage() {
  return <ServiceDetailPage slug="3d-tarama" />;
}
