type CheckoutNoticeProps = {
  title: string;
  description: string;
  variant?: "info" | "pickup";
  className?: string;
  children?: React.ReactNode;
};

export default function CheckoutNotice({
  title,
  description,
  variant = "info",
  className = "",
  children,
}: CheckoutNoticeProps) {
  const isPickup = variant === "pickup";

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ${className}`}
    >
      <div className="h-1 bg-[#02054b]" />

      <div className="flex items-start gap-4 p-5 sm:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#02054b]/[0.06] text-[#02054b]">
          {isPickup ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h18l-2-6H5l-2 6Zm2 0v10h14V10M9 20v-6h6v6"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              className="h-6 w-6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 11v5m0-8h.01"
              />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold tracking-tight text-gray-900">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {description}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}