"use client"

import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import Image from "next/image"
import Link from "next/link";
import { FaCheck, FaCircleQuestion, FaClock, FaXmark } from "react-icons/fa6";
import QuantityInputCart from "@/components/QuantityInputCart";
import { formatRupiah, sanitize } from "@/lib/sanitize";
  import { useRouter } from "next/navigation";
import { getImageSrc } from "@/lib/utils";

export const CartModule = () => {

  const router = useRouter();

  const { products, removeFromCart, calculateTotals, total } =
    useProductStore();

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    calculateTotals();
    toast.success("Product removed from the cart");
  };

  if (products.length === 0) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-10 w-10 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.085.836L5.25 6.75m0 0h14.568c.854 0 1.47.79 1.26 1.622l-1.2 4.8a1.5 1.5 0 0 1-1.455 1.136H8.118a1.5 1.5 0 0 1-1.455-1.136L5.25 6.75Zm2.25 10.5a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Zm9 0a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900">
          Keranjang Belanja Kosong
        </h1>

        <p className="mt-2 max-w-md text-sm text-gray-500">
          Maaf, Anda belum menambahkan item ke keranjang.
          Silakan pilih produk terlebih dahulu untuk melanjutkan checkout.
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-md bg-[#02054b] px-6 py-3 font-semibold text-white transition hover:bg-blue-950"
        >
          Mulai Belanja
        </button>
      </main>
    );
  }

  return (

    <form className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
  {/* Cart items */}
  <section aria-labelledby="cart-heading" className="min-w-0 lg:col-span-7">
    <h2 id="cart-heading" className="sr-only">
      Items in your shopping cart
    </h2>

    {products.length > 0 ? (
      <ul
        role="list"
        className="divide-y divide-gray-200 border-y border-gray-200"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="flex min-w-0 gap-3 py-5 sm:gap-5 sm:py-7"
          >
            {/* Product image */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-32 sm:w-32 lg:h-36 lg:w-36">
              <Image
                width={192}
                height={192}
                src={getImageSrc(
                  product?.image
                    ? `${product.image}`
                    : "/product_placeholder.jpg"
                )}
                alt={product.title}
                className="h-full w-full object-contain p-2 sm:p-3"
              />
            </div>

            {/* Product information */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold leading-5 text-gray-900 sm:text-base sm:leading-6">
                    <Link
                      href="#"
                      className="transition-colors hover:text-[#02054b]"
                    >
                      {sanitize(product.title)}
                    </Link>
                  </h3>

                  {product.variantTitle && (
                    <p className="mt-1 break-words text-xs text-gray-500 sm:text-sm">
                      Varian: {sanitize(product.variantTitle)}
                    </p>
                  )}
                </div>

                {/* Remove item */}
                <button
                  onClick={() => handleRemoveItem(product.id)}
                  type="button"
                  aria-label={`Hapus ${product.title} dari keranjang`}
                  className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <FaXmark className="size-4" aria-hidden="true" />
                </button>
              </div>

              {/* Price */}
              <p className="mt-2 break-words text-sm font-bold text-[#02054b] sm:text-base">
                {formatRupiah(product.price)}
              </p>

              {/* Quantity and availability */}
              <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-green-700 sm:text-sm">
                    <FaCheck
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    Tersedia
                  </p>

                  <QuantityInputCart product={product} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <div className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center sm:py-16">
        <h2 className="text-lg font-semibold text-gray-900">
          Keranjang kamu masih kosong
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Yuk, temukan produk yang kamu butuhkan.
        </p>
        <Link
          href="/shop"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#02054b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111b75]"
        >
          Mulai Belanja
        </Link>
      </div>
    )}
  </section>


      {/* Order summary */}
      <section
  aria-labelledby="summary-heading"
  className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:rounded-2xl sm:p-6 lg:sticky lg:top-6 lg:col-span-5 lg:p-7"
>
  <h2
    id="summary-heading"
    className="text-lg font-bold text-gray-900 sm:text-xl"
  >
    Ringkasan Order
  </h2>

  <dl className="mt-5 space-y-4 sm:mt-6">
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-gray-600">Subtotal</dt>
      <dd className="break-words text-right text-sm font-medium text-gray-900">
        {formatRupiah(total)}
      </dd>
    </div>

    <div className="flex items-start justify-between gap-4 border-t border-gray-200 pt-4">
      <dt className="text-base font-semibold text-gray-900">Total</dt>
      <dd className="break-words text-right text-base font-bold text-[#02054b] sm:text-lg">
        {formatRupiah(total)}
      </dd>
    </div>
  </dl>

  {products.length > 0 && (
    <div className="mt-6">
      <Link
        href="/checkout"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[#02054b] bg-[#02054b] px-4 py-3 text-sm font-bold uppercase text-white transition-colors hover:bg-white hover:text-[#02054b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2 sm:text-base"
      >
        Checkout
      </Link>
    </div>
  )}

  <p className="mt-4 text-center text-xs leading-5 text-gray-500">
    Biaya pengiriman akan diperhitungkan sesuai detail pesanan.
  </p>
</section>
    </form>

  )

}
