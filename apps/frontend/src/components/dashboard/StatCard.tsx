import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
  accent?: "slate" | "blue" | "violet";
};

const accentStyles = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({ label, value, hint, icon, accent = "slate" }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`mb-4 inline-flex rounded-xl p-2.5 ${accentStyles[accent]}`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </article>
  );
}
