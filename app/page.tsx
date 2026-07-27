import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/hero";
import Categories from "@/components/home/categories";
import FeaturedProducts from "@/components/home/featured-products";
import WhyChooseUs from "@/components/home/why-choose-us";
import Catering from "@/components/home/catering";
import Testimonials from "@/components/home/testimonials";
import WhatsAppCTA from "@/components/home/whatsapp-cta";
import FAQ from "@/components/home/faq";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <WhyChooseUs />
      <Catering />
      <Testimonials />
      <WhatsAppCTA />
      <FAQ />
      <Footer />
    </>
  );
}