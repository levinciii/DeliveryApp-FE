import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Hi, {user?.name}</h1>
      <p className="text-sm text-muted mb-6">Here's what's available right now.</p>

      <Card className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-ink">Browse a branch</h2>
          <p className="text-sm text-muted mt-1">
            Order history and merchant search aren't live yet — for now, browse a branch's
            products directly by ID.
          </p>
        </div>
        <Link to="/browse" className="text-sm font-medium text-primary whitespace-nowrap ml-4">
          Browse →
        </Link>
      </Card>
    </div>
  );
}
