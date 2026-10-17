import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">Page not found</h1>
        <p className="text-sm text-muted mb-6">That page doesn't exist.</p>
        <Link to="/" className="text-primary font-medium text-sm">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
