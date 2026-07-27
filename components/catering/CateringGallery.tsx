import Image from "next/image";
import {
  Camera,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const gallery = [
  {
    title: "Wedding Catering",
    image: "/images/catering/wedding.jpg",
  },
  {
    title: "Birthday Celebration",
    image: "/images/catering/birthday.jpg",
  },
  {
    title: "Corporate Event",
    image: "/images/catering/corporate.jpg",
  },
  {
    title: "Traditional Buffet",
    image: "/images/catering/buffet.jpg",
  },
  {
    title: "Festival Catering",
    image: "/images/catering/festival.jpg",
  },
  {
    title: "Dessert Counter",
    image: "/images/catering/dessert.jpg",
  },
];

export default function CateringGallery() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-[#FFF8EE] to-[#FFF4DE] py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#FFE8BF]/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFF4DE]/80 blur-3xl"
      />

      <Container className="relative">
        {/* Heading */}

        <SectionHeader
          badge={
            <Badge
              variant="neutral"
              className="gap-2 bg-white shadow-sm"
            >
              <Sparkles
                size={16}
                aria-hidden="true"
              />

              Our Gallery
            </Badge>
          }
          title="Moments We've Catered"
          description="Every celebration tells a story. Explore a glimpse of the weddings, corporate events, family gatherings and festive occasions we have had the privilege to cater."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Gallery grid */}

        <div className="mt-14 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {gallery.map((item) => (
            <Card
              key={item.title}
              padding="none"
              hover
              className="group overflow-hidden shadow-lg"
            >
              <div className="relative h-72 overflow-hidden sm:h-80">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                />

                <div className="absolute left-5 top-5">
                  <Badge
                    variant="neutral"
                    size="sm"
                    className="gap-2 border border-white/20 bg-white/15 text-white backdrop-blur-md"
                  >
                    <Camera
                      size={15}
                      aria-hidden="true"
                    />

                    Event
                  </Badge>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-2xl font-bold text-white">
                    {item.title}
                  </h3>

                  <div className="mt-4 h-1 w-16 rounded-full bg-[#C89B3C] transition-all duration-300 group-hover:w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom card */}

        <Card
          variant="glass"
          padding="lg"
          className="mt-16 bg-white/90 text-center shadow-lg backdrop-blur-sm sm:mt-20"
        >
          <h3 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
            Every Event Is Crafted with Care
          </h3>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">
            From elegant weddings to intimate family celebrations, our team
            focuses on exceptional food, beautiful presentation and reliable
            service to create memorable dining experiences for every guest.
          </p>
        </Card>
      </Container>
    </section>
  );
}