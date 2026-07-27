"use client";

import BackgroundOverlay from "./BackgroundOverlay";
import HeroContent from "./HeroContent";
import HeroSlider from "./HeroSlider";
import ScrollIndicator from "./ScrollIndicator";

export default function Hero() {
  return (
    <section className="relative min-h-[760px] w-full overflow-hidden bg-[#2F1608] sm:min-h-[820px] lg:h-[92vh] lg:min-h-[760px]">
      <HeroSlider />

      <BackgroundOverlay />

      <HeroContent />

      <ScrollIndicator />
    </section>
  );
}