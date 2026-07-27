"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";

import HeroButtons from "./HeroButtons";
import HeroStats from "./HeroStats";

export default function HeroContent() {
  return (
    <div className="absolute inset-0 z-20">
      <Container className="flex h-full items-center pt-24">
        <div className="w-full py-16 text-center text-white lg:py-20 lg:text-left">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <Badge
                variant="neutral"
                className="gap-2 border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md"
              >
                <Sparkles
                  size={16}
                  aria-hidden="true"
                />

                Premium Homemade Snacks
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15,
                duration: 0.7,
              }}
              className="mt-7 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl"
            >
              Taste the Tradition
              <span className="mt-2 block">
                Crafted with{" "}
                <span className="text-[#FFE4A3]">
                  Love
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.35,
                duration: 0.65,
              }}
              className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/85 sm:text-lg lg:mx-0"
            >
              Authentic homemade snacks, pickles, sweets and premium catering
              services prepared with carefully selected ingredients and
              time-honoured recipes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.55,
                duration: 0.65,
              }}
              className="mt-9"
            >
              <HeroButtons />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.75,
              duration: 0.7,
            }}
            className="mt-14 lg:mt-16"
          >
            <HeroStats />
          </motion.div>
        </div>
      </Container>
    </div>
  );
}