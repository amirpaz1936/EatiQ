export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900"
        aria-hidden
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 10c0-2.5 2-4.5 6-4.5s6 2 6 4.5v1.5H6V10z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M5 12h14v2.5c0 2.5-2.5 4.5-7 4.5s-7-2-7-4.5V12z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 7.5c.5-1 1.5-1.5 3-1.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold leading-tight text-slate-900">
          EatiQ
        </p>
        <p className="hidden text-xs text-slate-500 sm:block">
          Smart Nutrition Tracking
        </p>
      </div>
    </div>
  );
}
