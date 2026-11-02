import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 block text-center font-display text-2xl font-bold text-primary">
          Habit Circle
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="mb-5 text-2xl font-bold">{title}</h1>
          {children}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
