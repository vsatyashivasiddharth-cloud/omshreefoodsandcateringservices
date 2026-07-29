import type { Metadata } from "next";

import TrackOrderContent from "@/components/track-order/TrackOrderContent";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Securely check the latest delivery and shipment status of your Om Shree Foods order.",
};

export default function TrackOrderPage() {
  return <TrackOrderContent />;
}