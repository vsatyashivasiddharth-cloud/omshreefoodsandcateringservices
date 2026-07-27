import Link from "next/link";
import {
  ArrowRight,
  PackageSearch,
  Sparkles,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import prisma from "@/lib/prisma";

import ProductCard from "./ProductCard";

export const dynamic = "force-dynamic";

export default async function FeaturedProducts() {
  const featuredProducts =
    await prisma.product.findMany({
      where: {
        featured: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-[#FFF8F0] to-[#FFF4DE] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#FFE7B8]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#FFE7B8]/40 blur-3xl"
      />

      <Container className="relative">
        <SectionHeader
          badge={
            <Badge
              variant="neutral"
              className="gap-2"
            >
              <Sparkles
                size={17}
                aria-hidden="true"
              />

              Featured Collection
            </Badge>
          }
          title="Our Best-Selling Products"
          description="Carefully crafted with authentic recipes and premium ingredients, our customer favourites bring the taste of tradition to every home and celebration."
          align="center"
          className="mx-auto max-w-3xl"
        />

        {featuredProducts.length === 0 ? (
          <Card
            variant="glass"
            padding="lg"
            className="mx-auto mt-14 max-w-3xl bg-white/80 text-center shadow-xl backdrop-blur-sm sm:mt-16"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4DE] text-[#C89B3C]">
              <PackageSearch
                size={30}
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-[#6D2E00] sm:text-3xl">
              Featured Products Coming Soon
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
              No featured products are available at the
              moment. Browse the full shop to explore our
              homemade collection.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-8 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20"
            >
              Browse Shop

              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            </Link>
          </Card>
        ) : (
          <>
            <div className="mt-14 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    description:
                      product.description,
                    price: Number(product.price),
                    image:
                      product.image ||
                      "/images/no-image.jpg",
                    stock: Math.max(
                      0,
                      Math.floor(product.stock),
                    ),
                    featured: product.featured,
                    shippingWeightGrams: Math.max(
                      0,
                      Math.floor(
                       product.shippingWeightGrams,
                      ),
                    ),
                    categoryId:
                      product.categoryId,
                    category: {
                      id: product.category.id,
                      name: product.category.name,
                      slug:
                        product.category.slug,
                      image:
                        product.category.image,
                    },
                  }}
                />
              ))}
            </div>

            <div className="mt-14 flex justify-center sm:mt-16">
              <Link
                href="/shop"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#6D2E00] px-8 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#4E1F00] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6D2E00]/20"
              >
                Explore All Products

                <ArrowRight
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}