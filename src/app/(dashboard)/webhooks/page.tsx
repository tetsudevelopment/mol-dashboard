import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function WebhooksPage() {
  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Simulate gateway webhooks with HMAC-signed payloads (PaymentsWay)."
      />
      <ComingSoon feature="Webhooks" />
    </>
  );
}
