import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import FAQContent from "@/components/faq/FAQContent";

export default function FAQPage() {
  return (
    <>
      <Navbar />

      <main className="pt-24">
        <FAQContent />
      </main>

      <Footer />
    </>
  );
}