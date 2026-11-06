import type { OrderListItem, Page } from "@delivery/shared-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Pagination } from "../components/Pagination";
import { api, getErrorMessage } from "../lib/api";
import { formatDateTime, formatPeso } from "../lib/format";
import { statusBorder, statusLabel } from "../lib/status";

const PAGE_SIZE = 10;

export function OrdersPage() {
  const [result, setResult] = useState<Page<OrderListItem> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let stale = false;
    setIsLoading(true);
    api
      .get<Page<OrderListItem>>("/orders", { params: { page, pageSize: PAGE_SIZE } })
      .then(({ data }) => {
        if (stale) return;
        setError(null);
        setResult(data);
      })
      .catch((err) => !stale && setError(getErrorMessage(err, "Couldn't load your orders.")))
      .finally(() => !stale && setIsLoading(false));
    return () => {
      stale = true;
    };
  }, [page]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Your orders</h1>
      <p className="text-sm text-muted mb-6">Newest first.</p>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {isLoading && !result && <p className="text-sm text-muted">Loading…</p>}
      {result && result.total === 0 && (
        <p className="text-sm text-muted">
          You haven't ordered anything yet.{" "}
          <Link to="/browse" className="text-primary font-medium">
            Browse products →
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-3">
        {result?.items.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`}>
            <Card className={`border-l-4 ${statusBorder[order.status]} flex items-center justify-between gap-4 hover:bg-ink/5`}>
              <div>
                <h3 className="font-medium text-ink">{order.branch.name}</h3>
                <p className="text-sm text-muted">
                  {order.orderNumber} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
                  {formatDateTime(order.createdAt)}
                </p>
                <p className="text-sm text-ink mt-1">{statusLabel[order.status]}</p>
              </div>
              <p className="font-display font-semibold text-ink">{formatPeso(order.total)}</p>
            </Card>
          </Link>
        ))}
      </div>

      {result && (
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
      )}
    </div>
  );
}
