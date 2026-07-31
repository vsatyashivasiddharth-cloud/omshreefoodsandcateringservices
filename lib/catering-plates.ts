export type CateringPlateType =
  | "veg"
  | "non-veg";

export interface CateringPlate {
  slug: string;
  name: string;
  type: CateringPlateType;
  image: string;
  description: string;
  highlights: string[];
}

export const vegCateringPlates: CateringPlate[] = [
  {
    slug: "basic",
    name: "Basic Veg Plate",
    type: "veg",
    image:
      "/images/catering/plates/veg/basic.png",
    description:
      "A simple and satisfying vegetarian menu suitable for family gatherings and smaller functions.",
    highlights: [
      "Roti",
      "Bagara Rice",
      "White Rice",
      "Wet Curry",
      "Veg Fry",
      "Dal",
      "Sambar",
      "Chutney",
      "Raitha",
      "Papad",
      "Salad",
      "Sweet",
    ],
  },
  {
    slug: "standard",
    name: "Standard Veg Plate",
    type: "veg",
    image:
      "/images/catering/plates/veg/standard.png",
    description:
      "A balanced vegetarian catering menu with flavoured rice, curries, sweets and desserts.",
    highlights: [
      "Hot Item",
      "Roti",
      "Flavoured Rice",
      "Special Wet Curry",
      "Common Wet Curry",
      "Veg Fry",
      "Dal",
      "Salad",
      "Sweet",
      "Dessert",
      "Paan",
    ],
  },
  {
    slug: "gold",
    name: "Gold Veg Plate",
    type: "veg",
    image:
      "/images/catering/plates/veg/gold.png",
    description:
      "A premium vegetarian plate with starters, biryani, multiple curries, sweets and fruits.",
    highlights: [
      "Welcome Drink",
      "Veg Starter",
      "Salad",
      "Roti",
      "Veg Biryani",
      "Two Veg Curries",
      "Veg Fry",
      "Dal",
      "Hot Items",
      "Two Sweets",
      "Dessert",
      "Four Fruits",
      "Sweet Paan",
    ],
  },
  {
    slug: "diamond",
    name: "Diamond Veg Plate",
    type: "veg",
    image:
      "/images/catering/plates/veg/diamond.png",
    description:
      "Our premium vegetarian celebration menu with live counters, multiple dishes and an extensive dessert selection.",
    highlights: [
      "Two Welcome Drinks",
      "Two Veg Starters",
      "Veg Soup",
      "Salad",
      "Roti",
      "Two Veg Biryanis",
      "Three Veg Curries",
      "Two Veg Fries",
      "Two Dal Items",
      "Two Hot Items",
      "Live Tawa Sweet",
      "Two Sweets",
      "Two Desserts",
      "Live Sweet Paan",
      "Eight Fruits",
    ],
  },
];

export const nonVegCateringPlates: CateringPlate[] =
  [
    {
      slug: "basic",
      name: "Basic Non-Veg Plate",
      type: "non-veg",
      image:
        "/images/catering/plates/non-veg/basic.png",
      description:
        "A practical non-vegetarian catering menu with biryani, curry, vegetarian sides, sweet and dessert.",
      highlights: [
        "Hot Item",
        "Roti",
        "Bagara Rice or Veg Biryani",
        "Non-Veg Curry",
        "Veg Curry",
        "Veg Fry",
        "Sweet",
        "Dessert",
      ],
    },
    {
      slug: "standard",
      name: "Standard Non-Veg Plate",
      type: "non-veg",
      image:
        "/images/catering/plates/non-veg/standard.png",
      description:
        "A complete non-vegetarian plate with dum biryani, non-veg curry, vegetarian accompaniments and dessert.",
      highlights: [
        "Salads",
        "Roti",
        "Dum Biryani",
        "Non-Veg Curry",
        "Veg Curry",
        "Veg Fry",
        "Dal",
        "Hot Items",
        "Sweet",
        "Dessert",
      ],
    },
    {
      slug: "gold",
      name: "Gold Non-Veg Plate",
      type: "non-veg",
      image:
        "/images/catering/plates/non-veg/gold.png",
      description:
        "A premium non-vegetarian menu with starters, dum biryani, curries, sweets, desserts and fruits.",
      highlights: [
        "Welcome Drink",
        "Non-Veg Starter",
        "Veg Starter",
        "Salad",
        "Roti",
        "Special Dum Biryani",
        "Non-Veg Curry",
        "Non-Veg Fry",
        "Veg Biryani",
        "Veg Curry",
        "Veg Fry",
        "Dal",
        "Two Sweets",
        "Dessert",
        "Four Fruits",
        "Sweet Paan",
      ],
    },
    {
      slug: "diamond",
      name: "Diamond Non-Veg Plate",
      type: "non-veg",
      image:
        "/images/catering/plates/non-veg/diamond.png",
      description:
        "Our most extensive non-vegetarian celebration menu with live counters, multiple curries, biryanis and desserts.",
      highlights: [
        "Two Welcome Drinks",
        "Non-Veg Starter",
        "Veg Starter",
        "Salads",
        "Roti",
        "Special Dum Biryani",
        "Two Non-Veg Curries",
        "Non-Veg Fry",
        "Veg Biryani",
        "Two Veg Curries",
        "Veg Fry",
        "Dal",
        "Live Chaat Counter",
        "Live Sweet",
        "Hot Item",
        "Sweet",
        "Two Desserts",
        "Six Fruits",
        "Live Sweet Paan",
      ],
    },
  ];

export const allCateringPlates = [
  ...vegCateringPlates,
  ...nonVegCateringPlates,
];