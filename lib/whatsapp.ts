import { siteConfig } from "@/lib/site";

export const whatsappTriggerMessage =
  "Hi Om Shree Foods & Caterers";

export const whatsappUrl =
  `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
    whatsappTriggerMessage,
  )}`;
