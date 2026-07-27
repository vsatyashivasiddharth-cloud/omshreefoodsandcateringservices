export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: "general" | "catering" | "products";
}

export const faqs: FAQItem[] = [
  {
    id: 1,
    category: "catering",
    question: "What is the minimum number of guests for catering?",
    answer:
      "We cater for both small family gatherings and large events. Contact us with your guest count, and we'll recommend the best option.",
  },
  {
    id: 2,
    category: "catering",
    question: "Can I customize the menu?",
    answer:
      "Yes. We work with you to create a menu that matches your event, preferences, and budget.",
  },
  {
    id: 3,
    category: "catering",
    question: "Do you provide serving staff?",
    answer:
      "Yes, serving staff can be arranged depending on your event requirements.",
  },
  {
    id: 4,
    category: "catering",
    question: "How early should I book?",
    answer:
      "We recommend booking at least 2–4 weeks in advance, especially during the wedding and festival seasons.",
  },
  {
    id: 5,
    category: "catering",
    question: "Do you handle vegetarian menus?",
    answer:
      "Absolutely. We specialize in delicious vegetarian dishes and can also accommodate specific dietary preferences.",
  },

  // General FAQs
  {
    id: 6,
    category: "general",
    question: "Where are you located?",
    answer:
      "Om Shree Foods & Caterers is based in India. Please contact us for our exact address and service locations.",
  },
  {
    id: 7,
    category: "general",
    question: "How can I contact you?",
    answer:
      "You can reach us via phone, WhatsApp, or the Contact page on our website.",
  },

  // Product FAQs
  {
    id: 8,
    category: "products",
    question: "Do you offer home delivery?",
    answer:
      "Yes, home delivery is available for selected products depending on your location.",
  },
  {
    id: 9,
    category: "products",
    question: "Are your products freshly prepared?",
    answer:
      "Yes. We prepare our food using fresh ingredients while maintaining high standards of quality and hygiene.",
  },
];