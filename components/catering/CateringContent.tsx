import CateringCTA from "./CateringCTA";
import CateringFAQ from "./CateringFAQ";
import CateringGallery from "./CateringGallery";
import CateringHero from "./CateringHero";
import CateringProcess from "./CateringProcess";
import CateringServices from "./CateringServices";
import WhyChooseCatering from "./WhyChooseCatering";

export default function CateringContent() {
  return (
    <main>
      <CateringHero />

      <CateringServices />

      <WhyChooseCatering />

      <CateringProcess />

      <CateringGallery />

      <CateringFAQ />

      <CateringCTA />
    </main>
  );
}