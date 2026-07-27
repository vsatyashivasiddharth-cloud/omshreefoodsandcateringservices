import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const shippingPackages = [
  {
    name: "Small Box",
    code: "SMALL",
    lengthCm: 20,
    breadthCm: 15,
    heightCm: 10,
    emptyWeightGrams: 150,
    maxWeightGrams: 1500,
    active: true,
  },
  {
    name: "Medium Box",
    code: "MEDIUM",
    lengthCm: 30,
    breadthCm: 22,
    heightCm: 15,
    emptyWeightGrams: 250,
    maxWeightGrams: 4000,
    active: true,
  },
  {
    name: "Large Box",
    code: "LARGE",
    lengthCm: 40,
    breadthCm: 30,
    heightCm: 20,
    emptyWeightGrams: 450,
    maxWeightGrams: 8000,
    active: true,
  },
] as const;

async function main() {
  for (const shippingPackage of shippingPackages) {
    await prisma.shippingPackage.upsert({
      where: {
        code: shippingPackage.code,
      },
      update: {
        name: shippingPackage.name,
        lengthCm: shippingPackage.lengthCm,
        breadthCm: shippingPackage.breadthCm,
        heightCm: shippingPackage.heightCm,
        emptyWeightGrams:
          shippingPackage.emptyWeightGrams,
        maxWeightGrams:
          shippingPackage.maxWeightGrams,
        active: shippingPackage.active,
      },
      create: shippingPackage,
    });
  }

  console.log(
    `Seeded ${shippingPackages.length} shipping packages.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });