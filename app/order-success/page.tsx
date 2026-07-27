import type { Metadata } from "next";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/Navbar";
import OrderSuccessContent from "@/components/order-success/OrderSuccessContent";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description:
    "View your order confirmation, delivery details and purchased items.",
};

export const dynamic = "force-dynamic";

export default function OrderSuccessPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFF8EE] to-[#FFF4DE] pt-28">
        <OrderSuccessContent />
      </main>

      <Footer />
    </>
  );
}