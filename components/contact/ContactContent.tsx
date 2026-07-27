import BusinessHours from "./BusinessHours";
import ContactCTA from "./ContactCTA";
import ContactForm from "./ContactForm";
import ContactHero from "./ContactHero";
import ContactInfo from "./ContactInfo";
import FAQPreview from "./FAQPreview";
import MapSection from "./MapSection";

export default function ContactContent() {
  return (
    <main>
      <ContactHero />

      <ContactInfo />

      <ContactForm />

      <BusinessHours />

      <MapSection />

      <FAQPreview />

      <ContactCTA />
    </main>
  );
}