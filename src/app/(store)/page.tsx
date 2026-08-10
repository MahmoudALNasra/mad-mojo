import { UspMarquee } from "@/components/UspMarquee";
import {
  CategoryTiles,
  DeliveryBand,
  Hero,
  ProductRow,
  Reviews,
  StoryTeaser,
} from "@/components/home/HomeSections";
import { HomeRows } from "@/components/home/HomeRows";
import { getProducts } from "@/lib/data";

export default async function HomePage() {
  const products = await getProducts();

  const newDrop = products
    .filter((p) => p.badge === "new")
    .concat(products.filter((p) => p.badge !== "new"))
    .slice(0, 8);
  const bestSellers = products
    .filter((p) => p.badge === "bestseller")
    .concat(products.filter((p) => p.badge !== "bestseller"))
    .slice(0, 4);

  return (
    <>
      <Hero />
      <UspMarquee dark />
      <HomeRows newDrop={newDrop} bestSellers={bestSellers} />
      <CategoryTiles />
      <DeliveryBand />
      <StoryTeaser />
      <Reviews />
    </>
  );
}
