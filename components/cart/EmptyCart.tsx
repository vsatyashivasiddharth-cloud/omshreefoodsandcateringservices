import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  iconWrapperClassName: string;
  iconClassName: string;
}

const features: Feature[] = [
  {
    title: "Fast Delivery",
    description:
      "Freshly packed orders delivered quickly and safely to your doorstep.",
    icon: Truck,
    iconWrapperClassName: "bg-[#FFF4DE]",
    iconClassName: "text-[#C89B3C]",
  },
  {
    title: "Premium Quality",
    description:
      "Hygienically prepared using carefully selected premium ingredients.",
    icon: ShieldCheck,
    iconWrapperClassName: "bg-[#EEF9F0]",
    iconClassName: "text-green-600",
  },
  {
    title: "Customer Favourite",
    description:
      "Loved by families for authentic homemade taste and consistent quality.",
    icon: Star,
    iconWrapperClassName: "bg-[#FFF4DE]",
    iconClassName: "text-[#C89B3C]",
  },
];

export default function EmptyCart() {
  return (
    <Card
      padding="none"
      className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#FFFDF8] via-[#FFF8EE] to-[#FFF3DA] shadow-2xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#FFF0D1]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FFE5B5]/60 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-14 text-center sm:px-10 md:px-16 md:py-20">
        <Badge
          variant="neutral"
          className="gap-2 shadow-sm"
        >
          <Sparkles
            size={16}
            aria-hidden="true"
          />

          Fresh Homemade Goodness
        </Badge>

        <div className="mt-8 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-xl ring-8 ring-[#FFF7E8] transition-transform duration-300 hover:scale-105 sm:h-32 sm:w-32">
          <ShoppingBag
            size={56}
            className="text-[#C89B3C] sm:h-[60px] sm:w-[60px]"
            aria-hidden="true"
          />
        </div>

        <SectionHeader
          title="Your Cart Is Empty"
          description="It looks like you haven't added any delicious treats yet. Explore our handcrafted sweets, namkeen, snacks and catering specials prepared with authentic recipes and premium ingredients."
          align="center"
          className="mt-10 max-w-3xl"
        />

        <div className="mt-12 grid w-full gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                padding="md"
                hover
                className="bg-white/90 backdrop-blur-sm"
              >
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconWrapperClassName}`}
                >
                  <Icon
                    size={28}
                    className={feature.iconClassName}
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-[#6D2E00]">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>

        <Link
          href="/shop"
          className="mt-14 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-8 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20 active:scale-95 sm:px-10"
        >
          Continue Shopping

          <ArrowRight
            size={20}
            aria-hidden="true"
          />
        </Link>

        <p className="mt-6 max-w-2xl text-sm leading-6 text-gray-500">
          Discover authentic homemade snacks, sweets and catering for every
          celebration.
        </p>
      </div>
    </Card>
  );
}