import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "academic"
  | "arts"
  | "sports"
  | "service"
  | "tech"
  | "other"
  | "success"
  | "warning"
  | "danger"
  | "default";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  academic: "bg-blue-100 text-blue-800 border-blue-200",
  arts: "bg-purple-100 text-purple-800 border-purple-200",
  sports: "bg-green-100 text-green-800 border-green-200",
  service: "bg-orange-100 text-orange-800 border-orange-200",
  tech: "bg-indigo-100 text-indigo-800 border-indigo-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger: "bg-red-100 text-red-800 border-red-200",
  default: "bg-slate-100 text-slate-800 border-slate-200",
};

export default function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

