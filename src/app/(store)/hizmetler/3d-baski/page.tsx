import { createServiceMetadata, ServiceDetailPage } from "../service-detail";

export const metadata = createServiceMetadata("3d-baski");

export default function ThreeDPrintServicePage() {
  return <ServiceDetailPage slug="3d-baski" />;
}
