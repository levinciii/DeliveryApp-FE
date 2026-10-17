import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-ink/10 rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
}
