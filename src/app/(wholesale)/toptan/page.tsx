import { WholesaleInquiry } from "@/components/wholesale/wholesale-inquiry";
import { createPageMetadata } from "@/components/content/metadata";

export const metadata = createPageMetadata({
  title: "Toptan & Bayiler",
  description:
    "Toptan, bayi ve kurumsal üretim için OCTO STUDIO ile iletişime geçin. Fiyat bu sayfada listelenmez.",
  path: "/toptan",
});

export default function WholesalePage() {
  return <WholesaleInquiry />;
}
