import type { Metadata } from "next";

import OrderDetails from "@/components/admin/orders/OrderDetails";

interface OrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Order Details",
  description:
    "Review customer information, payment status and ordered products.",
};

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;

  return <OrderDetails id={id} />;
}