import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { BestSellersSection } from "@/components/home/best-sellers-section";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col bg-white w-full max-w-full overflow-x-hidden">
      {/* Flagship Hero Section */}
      <HeroSection />

      {/* Explore Categories & Shopping Benefits Carousel */}
      <CategoriesSection />

      {/* New Arrivals (Dynamic from MongoDB Backend) */}
      <NewArrivalsSection />

      {/* Best Sellers (Dynamic from Real Orders & Product Views) */}
      <BestSellersSection />
    </main>
  );
}
