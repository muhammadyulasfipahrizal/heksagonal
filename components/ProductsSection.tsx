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
    <section className="relative overflow-hidden border-t border-white/10 bg-[#02054b] px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-screen-2xl">
        <div className="mb-9 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-amber-400">
              Pilihan untuk Anda
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Produk unggulan
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/75 sm:text-base">
              Temukan produk pilihan untuk mendukung kebutuhan operasional,
              bisnis, dan industri Anda.
            </p>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
            {products.map((product) => (
              <ProductItem
                key={product.id}
                product={product}
                color="white"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-14 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
              <span aria-hidden="true">📦</span>
            </div>

            <h3 className="text-lg font-bold">
              Produk belum tersedia
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-100/70">
              Produk unggulan akan ditampilkan di sini setelah tersedia.
              Silakan kunjungi katalog untuk melihat produk lainnya.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-amber-400 transition hover:text-amber-300"
            >
              Jelajahi katalog
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        <div className="mt-14 flex justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-7 py-3 text-lg font-bold text-[#02054b] shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-amber-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#02054b]"
          >
            Lihat semua produk
            <span aria-hidden="true" className="text-xl">
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