import AboutCTA from "./AboutCTA";
import AboutHero from "./AboutHero";
import CustomerPromise from "./CustomerPromise";
import MissionVision from "./MissionVision";
import OurStory from "./OurStory";
import Process from "./Process";
import Specialties from "./Specialties";
import WhyChooseUs from "./WhyChooseUs";

export default function AboutContent() {
  return (
    <main>
      <AboutHero />

      <OurStory />

      <MissionVision />

      <WhyChooseUs />

      <Specialties />

      <Process />

      <CustomerPromise />

      <AboutCTA />
    </main>
  );
}