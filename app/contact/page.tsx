import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import ContactContent from "@/components/contact/ContactContent";

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="pt-24">
        <ContactContent />
      </main>

      <Footer />
    </>
  );
}