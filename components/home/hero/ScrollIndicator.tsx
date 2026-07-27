"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function ScrollIndicator() {
  return (
    <motion.div
      aria-hidden="true"
      animate={{
        y: [0, 10, 0],
      }}
      transition={{
        repeat: Infinity,
        duration: 1.6,
        ease: "easeInOut",
      }}
      className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 sm:block"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md">
        <ChevronDown size={26} />
      </div>
    </motion.div>
  );
}