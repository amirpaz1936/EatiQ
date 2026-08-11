import { useEffect, useState } from "react";
import { CameraIcon, UploadIcon } from "../components/icons";
import { ScanMealModal } from "../components/scan/ScanMealModal";
import { ScanResultsCard } from "../components/scan/ScanResultsCard";
import type { ScannedMeal } from "../api/scan";

export function ScanMealPage() {
  const [scanOpen, setScanOpen] = useState(false);
  const [result, setResult] = useState<ScannedMeal | null>(null);
  const [scanCompleteMessage, setScanCompleteMessage] = useState(false);

  useEffect(() => {
    if (!result) setScanOpen(true);
  }, [result]);

  useEffect(() => {
    if (!result) return;

    setScanCompleteMessage(true);

    const timer = window.setTimeout(() => {
      setScanCompleteMessage(false);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [result]);

  return (
    <>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Scan Meal
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Upload a meal photo or take a fresh picture to start scanning.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="flex min-h-40 touch-manipulation flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition hover:border-blue-300 hover:bg-blue-50/60"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UploadIcon />
            </span>
            <span className="text-base font-semibold text-slate-900">Choose from library</span>
            <span className="max-w-xs text-sm text-slate-500">
              Select a saved meal photo from your phone or computer.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="flex min-h-40 touch-manipulation flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition hover:border-slate-300 hover:bg-slate-100/70"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <CameraIcon />
            </span>
            <span className="text-base font-semibold text-slate-900">Take a picture now</span>
            <span className="max-w-xs text-sm text-slate-500">
              Use the camera on mobile or desktop.
            </span>
          </button>
        </div>
      </section>

      {result && (
        <>
          {scanCompleteMessage && (
            <div
              className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm"
              role="status"
              aria-live="polite"
            >
              <span className="font-semibold">Analysis complete!</span>{" "}
              Your results are ready.
            </div>
          )}

          <ScanResultsCard
            result={result}
            onClear={() => {
              setResult(null);
              setScanCompleteMessage(false);
            }}
            onSaved={() => {
              setResult(null);
              setScanCompleteMessage(false);
            }}
          />
        </>
      )}

      <ScanMealModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={setResult}
      />
    </>
  );
}