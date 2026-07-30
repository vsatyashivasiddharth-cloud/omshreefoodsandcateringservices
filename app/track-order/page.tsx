import type { Metadata } from "next";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/Navbar/Navbar";
import TrackOrderContent from "@/components/track-order/TrackOrderContent";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Check your recent Om Shree Foods orders and delivery status using your mobile number.",
};

export default function TrackOrderPage() {
  return (
    <>
      <Navbar />
      <TrackOrderContent />
      <Footer />
    </>
  );
}