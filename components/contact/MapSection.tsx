import {
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const mapEmbedUrl =
  process.env.NEXT_PUBLIC_GOOGLE_MAP_EMBED_URL;

export default function MapSection() {
  if (!mapEmbedUrl) {
    return null;
  }
  return (
    <section
      id="map"
      className="relative overflow-hidden bg-[#FFFDF8] py-20 sm:py-24"
    >
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#FFF4DE]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE8BF]/70 blur-3xl"
      />

      <Container className="relative">
        {/* Heading */}

        <SectionHeader
          badge={
            <Badge
              variant="neutral"
              className="gap-2 border border-[#F3DFC2]"
            >
              <Sparkles
                size={16}
                aria-hidden="true"
              />

              Visit Our Store
            </Badge>
          }
          title="Find Our Location"
          description="We would love to welcome you in person. Visit our store to explore our homemade delicacies or discuss your catering requirements with our team."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Map */}

        <Card
          padding="sm"
          className="mt-14 overflow-hidden shadow-2xl sm:mt-16"
        >
          <div className="overflow-hidden rounded-[24px]">
            <iframe
              title="Om Shree Foods and Caterers location"
              src={mapEmbedUrl}
              width="100%"
              height="520"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="block w-full border-0"
            />
          </div>
        </Card>

        {/* Location information */}

        <Card
          variant="glass"
          padding="lg"
          className="mt-10 bg-white/90 shadow-xl backdrop-blur-sm"
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D2E00] to-[#C89B3C] text-white shadow-lg">
                <MapPin
                  size={30}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#6D2E00]">
                  Om Shree Foods &amp; Caterers
                </h3>

                <p className="mt-3 text-lg leading-8 text-gray-600">
                  Hyderabad, Telangana
                </p>

                <p className="mt-2 text-gray-500">
                  Fresh Homemade Foods • Catering • Events
                </p>
              </div>
            </div>

            <Badge
              variant="neutral"
              size="lg"
              className="gap-3 self-start md:self-auto"
            >
              <Navigation
                size={22}
                aria-hidden="true"
              />

              Easy to Reach
            </Badge>
          </div>
        </Card>

        {/* Highlights */}

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card
            variant="filled"
            padding="md"
            hover
            className="text-center shadow-sm"
          >
            <h3 className="text-xl font-bold text-[#6D2E00]">
              Store Visit
            </h3>

            <p className="mt-3 leading-7 text-gray-600">
              Browse our freshly prepared homemade specialties.
            </p>
          </Card>

          <Card
            variant="filled"
            padding="md"
            hover
            className="text-center shadow-sm"
          >
            <h3 className="text-xl font-bold text-[#6D2E00]">
              Catering Consultation
            </h3>

            <p className="mt-3 leading-7 text-gray-600">
              Meet our team to discuss your upcoming event.
            </p>
          </Card>

          <Card
            variant="filled"
            padding="md"
            hover
            className="text-center shadow-sm"
          >
            <h3 className="text-xl font-bold text-[#6D2E00]">
              Fresh Pickups
            </h3>

            <p className="mt-3 leading-7 text-gray-600">
              Collect your favourite homemade snacks directly from us.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}