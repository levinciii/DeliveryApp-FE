import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useCart } from "../context/CartContext";
import { getErrorMessage } from "../lib/api";
import { formatPeso } from "../lib/format";

const MAX_QTY = 20;

export function CartPage() {
  const { cart, setItem, removeItem, clear } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: string, action: () => Promise<void>) {
    setBusyId(id);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update your cart."));
    } finally {
      setBusyId(null);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">Your cart</h1>
        <p className="text-sm text-muted mb-4">Nothing here yet.</p>
        <Link to="/browse" className="text-sm font-medium text-primary">
          Browse products →
        </Link>
      </div>
    );
  }

  const hasUnavailable = cart.items.some((i) => !i.available);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Your cart</h1>
      <p className="text-sm text-muted mb-6">
        From {cart.branch?.name} · {cart.branch?.merchantName}
      </p>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {hasUnavailable && (
        <p className="text-sm text-danger mb-4">
          Some items are no longer available. Remove them to check out.
        </p>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {cart.items.map((line) => {
          const busy = busyId === line.productId;
          return (
            <Card
              key={line.productId}
              className={`border-l-4 ${line.available ? "border-l-primary" : "border-l-danger"} flex items-center justify-between gap-4`}
            >
              <div>
                <h3 className="font-medium text-ink">{line.name}</h3>
                <p className="text-sm text-muted">
                  {formatPeso(line.unitPrice)} each{line.available ? "" : " · unavailable"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    aria-label={`Remove one ${line.name}`}
                    disabled={busy || line.quantity <= 1}
                    onClick={() => run(line.productId, () => setItem(line.productId, line.quantity - 1))}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                  <Button
                    variant="ghost"
                    aria-label={`Add one more ${line.name}`}
                    disabled={busy || line.quantity >= MAX_QTY || !line.available}
                    onClick={() => run(line.productId, () => setItem(line.productId, line.quantity + 1))}
                  >
                    +
                  </Button>
                </div>
                <p className="w-24 text-right font-display font-semibold text-ink">{formatPeso(line.lineTotal)}</p>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => run(line.productId, () => removeItem(line.productId))}
                >
                  Remove
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Subtotal ({cart.itemCount} items)</p>
          <p className="font-display text-xl font-semibold text-ink">{formatPeso(cart.subtotal)}</p>
          <p className="text-xs text-muted mt-1">Delivery and service fees are added at checkout.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => run("clear", clear)} disabled={busyId === "clear"}>
            Clear cart
          </Button>
          {hasUnavailable ? (
            <Button disabled>Checkout</Button>
          ) : (
            <Link to="/checkout">
              <Button>Checkout</Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
