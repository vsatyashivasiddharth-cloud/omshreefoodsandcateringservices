import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer";
import AboutContent from "@/components/about/AboutContent";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="pt-24">
        <AboutContent />
      </main>

      <Footer />
    </>
  );
}