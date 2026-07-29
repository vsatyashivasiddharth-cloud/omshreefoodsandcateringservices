import {
  PrismaClient,
} from "@prisma/client";

const prisma =
  new PrismaClient();

function normalizeIndianPhone(
  value: string,
): string | null {
  const digits = value.replace(
    /\D/g,
    "",
  );

  let normalized = digits;

  if (
    normalized.length === 12 &&
    normalized.startsWith("91")
  ) {
    normalized =
      normalized.slice(2);
  }

  if (
    normalized.length === 11 &&
    normalized.startsWith("0")
  ) {
    normalized =
      normalized.slice(1);
  }

  if (
    !/^[6-9]\d{9}$/.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

async function main() {
  const orders =
    await prisma.order.findMany({
      where: {
        phoneNormalized: null,
      },

      select: {
        id: true,
        phone: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  let updated = 0;
  let skipped = 0;

  for (const order of orders) {
    const phoneNormalized =
      normalizeIndianPhone(
        order.phone,
      );

    if (!phoneNormalized) {
      skipped += 1;

      console.warn(
        `Skipped order ${order.id}: invalid phone format.`,
      );

      continue;
    }

    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        phoneNormalized,
      },
    });

    updated += 1;
  }

  console.log({
    total: orders.length,
    updated,
    skipped,
  });
}

main()
  .catch((error) => {
    console.error(
      "Phone backfill failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });