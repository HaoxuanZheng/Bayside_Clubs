import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  onClick?: () => void;
};

export default function Card({ children, className, onClick, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        onClick ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md" : "",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

