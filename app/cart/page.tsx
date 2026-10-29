import { Loader } from "@/components/Loader";
import { CartModule } from "@/components/modules/cart";
import { Suspense } from "react";

const CartPage = () => {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto w-full max-w-screen-2xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12 xl:px-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            Keranjang Belanja
          </h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Periksa produk dan jumlah pesanan sebelum melanjutkan checkout.
          </p>
        </div>

        <Suspense fallback={<Loader />}>
          <CartModule />
        </Suspense>
      </div>
    </main>
  );
};

export default CartPage;