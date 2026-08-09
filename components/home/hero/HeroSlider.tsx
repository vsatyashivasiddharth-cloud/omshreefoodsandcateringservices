"use client";

import Image from "next/image";
import {
  Autoplay,
  EffectFade,
} from "swiper/modules";
import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import "swiper/css";
import "swiper/css/effect-fade";

const slides = [
  {
    src: "/images/hero/hero-1.jpg",
    alt: "Traditional homemade Andhra snacks",
  },
  {
    src: "/images/hero/hero-2.jpg",
    alt: "Fresh homemade snacks and sweets",
  },
  {
    src: "/images/hero/hero-3.jpg",
    alt: "Traditional Indian catering spread",
  },
  {
  src: "/images/hero/hero-4.webp",
  alt: "Authentic homemade food prepared with care",
},
  {
    src: "/images/hero/hero-5.jpg",
    alt: "Tasty homemade food prepared with care",
  },
];

export default function HeroSlider() {
  return (
    <div className="absolute inset-0">
      <Swiper
        modules={[
          Autoplay,
          EffectFade,
        ]}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        loop
        speed={1200}
        autoplay={{
          delay: 3500,
          disableOnInteraction:
            false,
          pauseOnMouseEnter:
            false,
        }}
        allowTouchMove={false}
        className="h-full w-full"
      >
        {slides.map(
          (slide, index) => (
            <SwiperSlide
              key={slide.src}
            >
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={
                    index === 0
                  }
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>
            </SwiperSlide>
          ),
        )}
      </Swiper>
    </div>
  );
}