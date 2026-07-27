import {
  ChefHat,
  Star,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import Card from "@/components/ui/Card";

const stats = [
  {
    icon: ChefHat,
    title: "Freshly Prepared",
  },
  {
    icon: Users,
    title: "1000+ Customers",
  },
  {
    icon: Star,
    title: "Premium Quality",
  },
  {
    icon: UtensilsCrossed,
    title: "Catering Experts",
  },
];

export default function HeroStats() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            padding="md"
            className="group border-white/15 bg-white/10 text-left text-white shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#C89B3C]/50 hover:bg-white/15 hover:shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C89B3C]/15 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C89B3C]/25 sm:h-14 sm:w-14">
              <Icon
                size={27}
                className="text-[#FFE4A3]"
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-4 text-sm font-semibold leading-6 text-white sm:mt-5 sm:text-lg">
              {item.title}
            </h2>
          </Card>
        );
      })}
    </div>
  );
}