import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    ghost: "bg-transparent text-ink border border-ink/15 hover:bg-ink/5",
    danger: "bg-danger text-white hover:bg-danger/90",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
