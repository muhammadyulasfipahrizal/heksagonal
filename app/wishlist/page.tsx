import { WishlistModule } from "@/components/modules/wishlist";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist | HEKSAGONAL",
  description: "View and manage your favorite products.",
};

const WishlistPage = () => {
  return (
    <main className="min-h-screen bg-white py-10 text-black sm:py-14">
      <div className="mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-10">
        <div className="mb-8 border-b border-gray-200 pb-6">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            Your collection
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            My Wishlist
          </h1>

          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            Keep track of the products you love and want to revisit.
          </p>
        </div>

        <WishlistModule />
      </div>
    </main>
  );
};

export default WishlistPage;