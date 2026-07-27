import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import CateringContent from "@/components/catering/CateringContent";

export default function CateringPage() {
  return (
    <>
      <Navbar />

      <main className="pt-24">
        <CateringContent />
      </main>

      <Footer />
    </>
  );
}