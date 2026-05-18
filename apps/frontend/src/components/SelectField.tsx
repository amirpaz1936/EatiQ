import { useEffect, useId, useRef, useState } from "react";

type Option = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  id: string;
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
};

export function SelectField({ label, id, options, value, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value) ?? options[0];
  const selectedLabel = selected?.label ?? "";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => (i + 1) % options.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        const option = options[highlightIndex];
        if (option) {
          onChange(option.value);
          setOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, highlightIndex, options, onChange]);

  function openList() {
    const currentIndex = options.findIndex((o) => o.value === value);
    setHighlightIndex(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  }

  function selectOption(option: Option) {
    onChange(option.value);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label`}
          aria-controls={listboxId}
          onClick={() => (open ? setOpen(false) : openList())}
          className={`flex w-full touch-manipulation items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-base text-slate-900 transition sm:text-sm ${
            open
              ? "border-blue-400 ring-2 ring-blue-400/25"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="absolute z-30 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightIndex;

              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectOption(option)}
                    className={`w-full px-3.5 py-2.5 text-left text-sm transition ${
                      isHighlighted
                        ? "bg-blue-500 text-white"
                        : "text-slate-900 hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`shrink-0 text-slate-600 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
