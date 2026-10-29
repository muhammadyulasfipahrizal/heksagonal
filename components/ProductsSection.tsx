import Link from "next/link";
import ProductItem from "./ProductItem";
import apiClient from "@/lib/api";

const ProductsSection = async () => {
  let products: any[] = [];

  try {
    const response = await apiClient.get("/api/products");

    if (!response.ok) {
      console.error("Failed to fetch products:", response.statusText);
    } else {
      const result = await response.json();

      const fetchedProducts = Array.isArray(result)
        ? result
        : Array.isArray(result?.products)
          ? result.products
          : [];

      products = fetchedProducts.slice(0, 9) as Product[];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <section className="
      relative isolate overflow-hidden
      border-t border-white/10
      bg-[#02054b] px-3 py-10 text-white
      sm:px-6 sm:py-14
      lg:px-8 lg:py-20
    ">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -right-20 -top-20
          h-48 w-48 rounded-full bg-blue-400/10 blur-3xl
          sm:-right-32 sm:-top-32 sm:h-96 sm:w-96
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -bottom-24 -left-20
          h-48 w-48 rounded-full bg-amber-400/10 blur-3xl
          sm:-bottom-40 sm:-left-32 sm:h-96 sm:w-96
        "
      />

      <div className="relative mx-auto max-w-container">
        <div className="mb-7 flex flex-col gap-4 sm:mb-10 sm:gap-5 lg:mb-12">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400 sm:mb-3 sm:text-xs sm:tracking-[0.22em]">
              Pilihan untuk Anda
            </p>

            <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Produk unggulan
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75 sm:mt-4 sm:text-base">
              Temukan produk pilihan untuk mendukung kebutuhan operasional,
              bisnis, dan industri Anda.
            </p>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-7">
            {products.map((product) => (
              <ProductItem
                key={product.id}
                product={product}
                color="white"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-8 text-center backdrop-blur-sm sm:rounded-2xl sm:px-5 sm:py-14">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl sm:h-14 sm:w-14 sm:rounded-2xl">
              <span aria-hidden="true">📦</span>
            </div>

            <h3 className="text-base font-bold sm:text-lg">
              Produk belum tersedia
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-100/70">
              Produk unggulan akan ditampilkan di sini setelah tersedia.
              Silakan kunjungi katalog untuk melihat produk lainnya.
            </p>

            <Link
              href="/shop"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 font-semibold text-amber-400 transition hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:mt-6"
            >
              Jelajahi katalog
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        <div className="mt-8 flex justify-center sm:mt-12">
          <Link
            href="/shop"
            className="
              btn min-h-12 w-full max-w-sm
              gap-2 rounded-xl border-0
              bg-white px-5 text-sm font-bold
              normal-case text-[#02054b] shadow-lg
              transition duration-300
              hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-xl
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-white
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[#02054b]
              sm:w-auto sm:px-7 sm:text-base
            "
          >
            Lihat semua produk
            <span aria-hidden="true" className="text-lg sm:text-xl">
              →
            </span>
          </Link>
        </div>

        {/* {products.length > 0 && (
          <div className="mt-10 border-t border-white/10 pt-6 text-center sm:mt-12">
            <p className="text-sm text-blue-100/60">
              Menampilkan {products.length} produk pilihan
            </p>
          </div>
        )} */}
      </div>
    </section>
  );
};

export default ProductsSection;