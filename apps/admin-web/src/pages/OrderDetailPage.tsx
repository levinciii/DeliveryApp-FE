import type { OrderDetail, OrderStatus } from "@delivery/shared-types";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { OrderActions } from "../components/OrderActions";
import { api, getErrorMessage } from "../lib/api";
import { formatDateTime, formatPeso } from "../lib/format";
import { statusBorder, statusLabel } from "../lib/status";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<OrderDetail>(`/orders/${id}`);
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load this order."));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: OrderStatus) {
    const { data } = await api.patch<OrderDetail>(`/orders/${id}/status`, { status });
    setOrder(data);
    setError(null);
  }

  if (!order) {
    return (
      <div className="max-w-3xl">
        {error ? <p className="text-sm text-danger">{error}</p> : <p className="text-sm text-muted">Loading…</p>}
        <Link to="/orders" className="text-sm font-medium text-primary mt-4 inline-block">
          ← Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link to="/orders" className="text-sm font-medium text-primary">
        ← Orders
      </Link>
      <h1 className="font-display text-2xl font-semibold text-ink mt-3 mb-1">{order.orderNumber}</h1>
      <p className="text-sm text-muted mb-6">
        {order.branch.merchantName} · {order.branch.name} · {formatDateTime(order.createdAt)}
      </p>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <Card className={`border-l-4 ${statusBorder[order.status]} mb-6`}>
        <p className="font-display font-semibold text-ink mb-3">{statusLabel[order.status]}</p>
        {order.allowedNextStatuses.length > 0 ? (
          <OrderActions
            orderNumber={order.orderNumber}
            allowed={order.allowedNextStatuses}
            onChange={changeStatus}
            onError={setError}
          />
        ) : (
          <p className="text-sm text-muted">No further actions available for you on this order.</p>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Customer</h2>
          <p className="text-sm text-ink">{order.customer.name}</p>
          <p className="text-sm text-muted">{order.customer.phone ?? "No phone number"}</p>
          <h2 className="font-display text-lg font-semibold text-ink mt-4 mb-2">Deliver to</h2>
          <p className="text-sm text-ink">{order.deliveryAddress.address}</p>
          <p className="text-xs text-muted">
            {order.deliveryAddress.latitude.toFixed(5)}, {order.deliveryAddress.longitude.toFixed(5)}
          </p>
          {order.notes && <p className="text-sm text-muted mt-3">Note: {order.notes}</p>}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Items</h2>
          <ul className="flex flex-col gap-1 mb-4">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span className="text-ink">
                  {item.quantity} × {item.name}
                </span>
                <span className="text-muted">{formatPeso(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="border-t border-ink/10 pt-3 flex flex-col gap-1 text-sm">
            <Row label="Subtotal" value={formatPeso(order.subtotal)} />
            <Row label="Delivery" value={formatPeso(order.deliveryFee)} />
            <Row label="Service fee" value={formatPeso(order.serviceFee)} />
            <div className="flex justify-between font-display font-semibold text-ink text-base pt-2">
              <dt>Total</dt>
              <dd>{formatPeso(order.total)}</dd>
            </div>
          </dl>
          {order.payment && (
            <p className="text-sm text-muted mt-3">
              {order.payment.method} · {order.payment.status.toLowerCase()}
            </p>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">History</h2>
        <ol className="flex flex-col gap-2">
          {order.history.map((h, index) => (
            <li key={`${h.status}-${index}`} className="flex justify-between text-sm">
              <span className="text-ink">{statusLabel[h.status]}</span>
              <span className="text-muted">{formatDateTime(h.changedAt)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
