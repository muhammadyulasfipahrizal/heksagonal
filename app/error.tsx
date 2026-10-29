
"use client"

import { AiOutlineWarning } from "react-icons/ai"

const GlobalError = ({ error }: { error: Error }) => {
  return (
    <div className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-4 text-center shadow-sm sm:min-h-[280px] sm:rounded-2xl sm:p-6 lg:min-h-[300px] lg:p-8">
      <AiOutlineWarning className="mb-3 h-9 w-9 shrink-0 text-red-500 sm:mb-4 sm:h-11 sm:w-11 lg:h-12 lg:w-12" />

      <h3 className="text-lg font-semibold leading-snug text-red-700 sm:text-xl lg:text-2xl">
        Something went wrong
      </h3>

      <p className="mt-2 w-full max-w-md break-words text-sm leading-6 text-red-500 sm:mt-3 sm:text-base">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
    </div>
  );
};

export default GlobalError
