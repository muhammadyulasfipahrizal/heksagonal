import { WishlistModule } from "@/components/modules/wishlist";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist | HEKSAGONAL",
  description: "View and manage your favorite products.",
};

const WishlistPage = () => {
  return (
    <main className="min-h-screen bg-gray-50 py-7 text-gray-900 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-10">
        <header className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:mb-8 sm:p-7 lg:p-9">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#02054b]/5 text-[#02054b] sm:h-14 sm:w-14">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6 sm:h-7 sm:w-7"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 sm:text-sm">
                Your collection
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                My Wishlist
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                Keep track of the products you love and want to revisit.
              </p>
            </div>
          </div>
        </header>

        <WishlistModule />
      </div>
    </main>
  );
};

export default WishlistPage;