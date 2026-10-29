import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] w-full items-center justify-center bg-white px-4 py-16 sm:min-h-[70vh] sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto w-full max-w-xl text-center">
        {/* 404 Badge */}
        <p className="mx-auto inline-flex h-14 min-w-14 items-center justify-center rounded-full border border-[#02054b]/15 bg-[#02054b]/5 px-4 text-base font-bold tracking-widest text-[#02054b] sm:h-16 sm:min-w-16 sm:text-lg">
          404
        </p>

        {/* Heading */}
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-gray-900 sm:mt-6 sm:text-4xl lg:text-5xl">
          Page not found
        </h1>

        {/* Description */}
        <p className="mx-auto mt-4 max-w-md break-words text-sm leading-6 text-gray-500 sm:mt-5 sm:text-base sm:leading-7">
          Sorry, we couldn’t find the page you’re looking for. The page may
          have been moved, deleted, or the URL may be incorrect.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 min-[400px]:flex-row min-[400px]:items-center sm:mt-10 sm:gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#02054b] bg-[#02054b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white hover:text-[#02054b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2"
          >
            Back to home
          </Link>

          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#02054b] hover:text-[#02054b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2"
          >
            Contact support
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Helper text */}
        <p className="mt-8 text-xs leading-5 text-gray-400 sm:mt-10 sm:text-sm">
          Error code: 404 · Page not found
        </p>
      </div>
    </main>
  );
}