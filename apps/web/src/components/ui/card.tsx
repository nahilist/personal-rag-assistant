import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-[#0C101B]/80 backdrop-blur-md border border-white/[0.08] rounded-2xl shadow-xl p-6 transition-all",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
