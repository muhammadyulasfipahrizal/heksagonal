import { CategoryMenu, Hero, ProductsSection } from "@/components";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <CategoryMenu />
      <ProductsSection />
    </main>
  );
}