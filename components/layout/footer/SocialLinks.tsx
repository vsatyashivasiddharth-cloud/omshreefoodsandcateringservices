import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";

const socials = [
  {
    icon: FaFacebookF,
    href: "#",
    label: "Facebook",
  },
  {
    icon: FaInstagram,
    href: "#",
    label: "Instagram",
  },
  {
    icon: FaYoutube,
    href: "#",
    label: "YouTube",
  },
];

export default function SocialLinks() {
  return (
    <div className="flex flex-wrap gap-3">
      {socials.map((social) => {
        const Icon = social.icon;

        return (
          <Link
            key={social.label}
            href={social.href}
            aria-label={social.label}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition-all duration-300 hover:-translate-y-1 hover:border-[#C89B3C] hover:bg-[#C89B3C] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
          >
            <Icon
              size={17}
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </div>
  );
}