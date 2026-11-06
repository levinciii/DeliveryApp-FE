import type { OrderListItem, OrderStatus, Page } from "@delivery/shared-types";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { OrderActions } from "../components/OrderActions";
import { Pagination } from "../components/Pagination";
import { api, getErrorMessage } from "../lib/api";
import { formatDateTime, formatPeso } from "../lib/format";
import { statusBorder, statusLabel } from "../lib/status";

const PAGE_SIZE = 10;
const REFRESH_MS = 20_000;

const filters: { label: string; value: OrderStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY_FOR_PICKUP" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function OrdersPage() {
  const [result, setResult] = useState<Page<OrderListItem> | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("PENDING");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Page<OrderListItem>>("/orders", {
        params: { page, pageSize: PAGE_SIZE, ...(filter === "ALL" ? {} : { status: filter }) },
      });
      // Acting on the last order of a later page leaves it empty: step back one page.
      if (data.items.length === 0 && data.page > 1) {
        setPage(data.page - 1);
        return;
      }
      setResult(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load orders."));
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    setIsLoading(true);
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  function changeFilter(next: OrderStatus | "ALL") {
    setFilter(next);
    setPage(1);
  }

  async function changeStatus(orderId: string, status: OrderStatus) {
    await api.patch(`/orders/${orderId}/status`, { status });
    await load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Orders</h1>
      <p className="text-sm text-muted mb-6">
        Every order on the platform. Merchants have no portal yet, so you can move orders along from here. The
        list refreshes every {REFRESH_MS / 1000} seconds.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => changeFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === f.value ? "bg-primary/10 text-primary" : "text-muted hover:bg-ink/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {isLoading && !result && <p className="text-sm text-muted">Loading…</p>}
      {result && result.total === 0 && <p className="text-sm text-muted">No orders in this view.</p>}

      <div className="flex flex-col gap-3">
        {result?.items.map((order) => (
          <Card key={order.id} className={`border-l-4 ${statusBorder[order.status]}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link to={`/orders/${order.id}`} className="font-medium text-ink hover:text-primary">
                  {order.orderNumber}
                </Link>
                <p className="text-sm text-muted">
                  {order.customerName} → {order.branch.name} · {order.itemCount} item
                  {order.itemCount === 1 ? "" : "s"} · {formatDateTime(order.createdAt)}
                </p>
                <p className="text-sm text-ink mt-1">{statusLabel[order.status]}</p>
              </div>
              <p className="font-display font-semibold text-ink">{formatPeso(order.total)}</p>
            </div>
            {order.allowedNextStatuses.length > 0 && (
              <div className="mt-4">
                <OrderActions
                  orderNumber={order.orderNumber}
                  allowed={order.allowedNextStatuses}
                  onChange={(status) => changeStatus(order.id, status)}
                  onError={setError}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {result && (
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
      )}
    </div>
  );
}
