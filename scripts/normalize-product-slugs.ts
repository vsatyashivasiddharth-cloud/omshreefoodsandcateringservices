import prisma from "../lib/prisma";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(
  baseSlug: string,
  productId: string,
) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existingProduct =
      await prisma.product.findFirst({
        where: {
          slug,
          NOT: {
            id: productId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!existingProduct) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function main() {
  const products =
    await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  console.log(
    `Checking ${products.length} products...`,
  );

  let updatedCount = 0;
  let unchangedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    const generatedSlug = createSlug(
      product.slug || product.name,
    );

    if (!generatedSlug) {
      console.warn(
        `Skipped "${product.name}" because a valid slug could not be generated.`,
      );

      skippedCount += 1;
      continue;
    }

    const uniqueSlug =
      await createUniqueSlug(
        generatedSlug,
        product.id,
      );

    if (product.slug === uniqueSlug) {
      console.log(
        `Unchanged: ${product.name} → ${product.slug}`,
      );

      unchangedCount += 1;
      continue;
    }

    await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        slug: uniqueSlug,
      },
    });

    console.log(
      `Updated: ${product.name}`,
    );

    console.log(
      `  Old: ${product.slug}`,
    );

    console.log(
      `  New: ${uniqueSlug}`,
    );

    updatedCount += 1;
  }

  console.log("");
  console.log("Slug normalization completed.");
  console.log(`Updated: ${updatedCount}`);
  console.log(
    `Unchanged: ${unchangedCount}`,
  );
  console.log(`Skipped: ${skippedCount}`);
}

main()
  .catch((error) => {
    console.error(
      "Product slug normalization failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });