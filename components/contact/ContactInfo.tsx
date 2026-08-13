import Link from "next/link";
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";

import { contact } from "@/lib/constants/contact";
import { whatsappUrl } from "@/lib/whatsapp";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const cards = [
  {
    icon: Phone,
    title: "Call Us",
    value: contact.phone,
    href: `tel:${contact.phone.replace(/\s+/g, "")}`,
  },
  {
    icon: Mail,
    title: "Email Us",
    value: contact.email,
    href: `mailto:${contact.email}`,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: contact.whatsapp,
    href: whatsappUrl,
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: `${contact.address.city}, ${contact.address.state}`,
    href: "/contact#map",
  },
];

const highlights = [
  "Fresh Homemade Food",
  "Catering Specialists",
  "Friendly Customer Support",
];

export default function ContactInfo() {
  return (
    <section className="relative overflow-hidden bg-[#FFFDF8] py-20 sm:py-24">
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#FFF4DE]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE8BF]/70 blur-3xl"
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

              Reach Us Anytime
            </Badge>
          }
          title="Multiple Ways to Connect"
          description="Whether you prefer calling, emailing, messaging on WhatsApp or visiting us in person, our team is always happy to help."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Contact cards */}

        <div className="mt-14 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:gap-8 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group block"
              >
                <Card
                  padding="lg"
                  hover
                  className="h-full bg-white/90 backdrop-blur-sm"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DE] to-[#FFE8BF] transition-transform duration-300 group-hover:scale-110">
                    <Icon
                      size={30}
                      className="text-[#C89B3C]"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-[#6D2E00]">
                    {card.title}
                  </h3>

                  <p className="mt-4 break-words leading-7 text-gray-600">
                    {card.value}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Address card */}

        <Card
          variant="glass"
          padding="lg"
          className="mt-16 bg-white/90 shadow-xl backdrop-blur-sm sm:mt-20"
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#6D2E00] to-[#C89B3C] text-white shadow-lg">
              <MapPin
                size={40}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-3xl font-bold text-[#6D2E00]">
                Visit Our Store
              </h3>

              <address className="mt-5 not-italic text-lg leading-9 text-gray-600">
                {contact.address.line1}
                <br />
                {contact.address.line2}
                <br />
                {contact.address.city}, {contact.address.state}
                <br />
                {contact.address.pincode}
              </address>
            </div>
          </div>

          {/* Highlights */}

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-[#F3DFC2] bg-[#FFF4DE] p-5 text-center"
              >
                <h4 className="font-bold text-[#6D2E00]">
                  {highlight}
                </h4>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </section>
  );
}