"use client";

import { useState } from "react";

import FAQCTA from "./FAQCTA";
import FAQHero from "./FAQHero";
import FAQList from "./FAQList";
import FAQSearch from "./FAQSearch";

export default function FAQContent() {
  const [search, setSearch] = useState("");

  return (
    <main>
      <FAQHero />

      <FAQSearch
        search={search}
        onSearchChange={setSearch}
      />

      <FAQList search={search} />

      <FAQCTA />
    </main>
  );
}