import type { OrderDetail } from "@delivery/shared-types";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { api, getErrorMessage } from "../lib/api";
import { formatDateTime, formatPeso } from "../lib/format";
import { isFinished, statusBorder, statusHint, statusLabel } from "../lib/status";

const REFRESH_MS = 15_000;

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  // The merchant moves the order along, so keep the page fresh until it's finished.
  useEffect(() => {
    if (!order || isFinished(order.status)) return;
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [order, load]);

  async function cancel() {
    if (!window.confirm("Cancel this order?")) return;
    setIsCancelling(true);
    try {
      const { data } = await api.patch<OrderDetail>(`/orders/${id}/status`, { status: "CANCELLED" });
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't cancel the order."));
      load();
    } finally {
      setIsCancelling(false);
    }
  }

  if (!order) {
    return (
      <div className="max-w-2xl">
        {error ? <p className="text-sm text-danger">{error}</p> : <p className="text-sm text-muted">Loading…</p>}
        <Link to="/orders" className="text-sm font-medium text-primary mt-4 inline-block">
          ← Your orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to="/orders" className="text-sm font-medium text-primary">
        ← Your orders
      </Link>
      <h1 className="font-display text-2xl font-semibold text-ink mt-3 mb-1">{order.orderNumber}</h1>
      <p className="text-sm text-muted mb-6">
        {order.branch.name} · {formatDateTime(order.createdAt)}
      </p>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <Card className={`border-l-4 ${statusBorder[order.status]} mb-6 flex items-center justify-between gap-4`}>
        <div>
          <p className="font-display font-semibold text-ink">{statusLabel[order.status]}</p>
          <p className="text-sm text-muted">{statusHint[order.status]}</p>
        </div>
        {order.allowedNextStatuses.includes("CANCELLED") && (
          <Button variant="danger" onClick={cancel} disabled={isCancelling}>
            {isCancelling ? "Cancelling…" : "Cancel order"}
          </Button>
        )}
      </Card>

      <Card className="mb-6">
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
            Payment: cash on delivery ({order.payment.status.toLowerCase()})
          </p>
        )}
      </Card>

      <Card className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink mb-2">Delivering to</h2>
        <p className="text-sm text-ink">{order.deliveryAddress.address}</p>
        {order.notes && <p className="text-sm text-muted mt-2">Note: {order.notes}</p>}
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">Progress</h2>
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
