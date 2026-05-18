import type { TextareaHTMLAttributes } from "react";

type TextAreaFieldProps = {
  label: string;
  id: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ label, id, className = "", ...props }: TextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        className={`w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm ${className}`}
        {...props}
      />
    </div>
  );
}
