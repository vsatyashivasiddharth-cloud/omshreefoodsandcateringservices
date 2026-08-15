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
      </Container>
    </section>
  );
}