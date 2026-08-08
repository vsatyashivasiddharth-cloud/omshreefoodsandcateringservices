export default function AnnouncementBar() {
  return (
    <div className="bg-[#5A1F00] text-white">
      <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-center px-4 py-2 text-center text-xs font-semibold leading-5 sm:text-sm">
        <p>
          Worldwide Shipping Available — WhatsApp us for
          international orders
          <span
            className="mx-2 text-[#F5C76C]"
            aria-hidden="true"
          >
            •
          </span>
          Get up to ₹99 OFF shipping on orders ₹999+
          <span
            className="mx-2 text-[#F5C76C]"
            aria-hidden="true"
          >
            •
          </span>
          Get up to ₹199 OFF shipping on orders ₹1,499+
        </p>
      </div>
    </div>
  );
}