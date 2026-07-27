import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      aria-label="Om Shree Foods and Caterers home"
      className="group flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
    >
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#F3DFC2] bg-gradient-to-br from-[#FFFDF8] to-[#FFF4DE] shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md lg:h-16 lg:w-16">
        <Image
          src="/logo/logo-new.png"
          alt=""
          width={64}
          height={64}
          priority
          className="h-11 w-11 object-contain transition-transform duration-300 group-hover:scale-105 lg:h-13 lg:w-13"
        />
      </div>

      <div className="hidden min-w-0 md:block">
        <p className="font-heading text-2xl font-bold leading-none tracking-tight text-[#6D2E00] transition-colors duration-300 group-hover:text-[#C89B3C] lg:text-[1.7rem]">
          Om Shree
        </p>

        <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500 lg:text-[11px]">
          Foods &amp; Caterers
        </p>
      </div>
    </Link>
  );
}