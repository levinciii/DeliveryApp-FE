import type { OrderListItem, Page } from "@delivery/shared-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { formatPeso } from "../lib/format";
import { statusBorder, statusLabel } from "../lib/status";

export function DashboardPage() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [recent, setRecent] = useState<OrderListItem[]>([]);

  useEffect(() => {
    api
      .get<Page<OrderListItem>>("/orders", { params: { pageSize: 3 } })
      .then(({ data }) => setRecent(data.items))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Hi, {user?.name}</h1>
      <p className="text-sm text-muted mb-6">Here's what's going on.</p>

      <Card className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-medium text-ink">Your cart</h2>
          <p className="text-sm text-muted mt-1">
            {cart.itemCount === 0
              ? "Empty. Pick a place to start an order."
              : `${cart.itemCount} items from ${cart.branch?.name} · ${formatPeso(cart.subtotal)}`}
          </p>
        </div>
        <Link
          to={cart.itemCount === 0 ? "/browse" : "/cart"}
          className="text-sm font-medium text-primary whitespace-nowrap ml-4"
        >
          {cart.itemCount === 0 ? "Browse →" : "View cart →"}
        </Link>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">Recent orders</h2>
        {recent.length > 0 && (
          <Link to="/orders" className="text-sm font-medium text-primary">
            See all →
          </Link>
        )}
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}>
              <Card className={`border-l-4 ${statusBorder[order.status]} flex items-center justify-between hover:bg-ink/5`}>
                <div>
                  <h3 className="font-medium text-ink">{order.branch.name}</h3>
                  <p className="text-sm text-muted">
                    {order.orderNumber} · {statusLabel[order.status]}
                  </p>
                </div>
                <p className="font-display font-semibold text-ink">{formatPeso(order.total)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
