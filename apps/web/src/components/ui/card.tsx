import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-[#090A0F] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-6 transition-all shadow-xl",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
