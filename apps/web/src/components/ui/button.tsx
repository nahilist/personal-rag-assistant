import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#07090E] disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary:
      "bg-white hover:bg-slate-200 text-black shadow-md shadow-white/10 active:scale-95 transition-all focus:ring-white",
    secondary:
      "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/10 active:scale-95 focus:ring-slate-400",
    danger:
      "bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 active:scale-95 focus:ring-red-500",
    outline:
      "border border-white/[0.12] bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] hover:text-white hover:border-white/25 active:scale-95 focus:ring-white",
    ghost:
      "text-slate-400 hover:text-white hover:bg-white/[0.06] focus:ring-slate-400",
  };

  return (
    <button
      type={props.type || "button"}
      className={twMerge(
        clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
