import React, { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
}

/**
 * Common reusable Button component
 * Default color: #DB6516 (Aptech primary orange) with white text (#FFFFFF).
 * All layout properties (height, width, font, font-size, padding, radius)
 * can be overridden or customized via `className`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      type = "button",
      variant = "primary",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB6516] active:scale-[0.98]";

    const variantStyles: Record<"primary" | "outline" | "ghost", string> = {
      primary: "bg-[#DB6516] hover:bg-[#c45710] text-[#FFFFFF]",
      outline: "border border-[#DB6516] text-[#DB6516] hover:bg-[#fff7ed] bg-transparent",
      ghost: "text-[#DB6516] hover:bg-[#fff7ed] bg-transparent",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
