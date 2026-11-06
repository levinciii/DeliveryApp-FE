import type { BranchSummary, Page, Product } from "@delivery/shared-types";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CartBar } from "../components/CartBar";
import { Pagination } from "../components/Pagination";
import { useCart } from "../context/CartContext";
import { api, getErrorCode, getErrorMessage } from "../lib/api";
import { formatPeso } from "../lib/format";

const PAGE_SIZE = 20;
const MAX_QTY = 20;

export function BranchPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const { cart, setItem, removeItem } = useCart();
  const [branch, setBranch] = useState<BranchSummary | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page<Product> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Set when the customer tries to add from a different branch than their cart holds.
  const [pendingSwap, setPendingSwap] = useState<{ productId: string; quantity: number } | null>(null);

  useEffect(() => {
    setBranch(null);
    setBranchError(null);
    setPage(1);
    api
      .get<BranchSummary>(`/branches/${branchId}`)
      .then(({ data }) => setBranch(data))
      .catch((err) => setBranchError(getErrorMessage(err, "Couldn't load this place.")));
  }, [branchId]);

  useEffect(() => {
    let stale = false;
    api
      .get<Page<Product>>("/products", { params: { branchId, page, pageSize: PAGE_SIZE } })
      .then(({ data }) => {
        if (stale) return;
        setResult(data);
        setError(null);
      })
      .catch((err) => !stale && setError(getErrorMessage(err, "Couldn't load the menu.")));
    return () => {
      stale = true;
    };
  }, [branchId, page]);

  const quantityInCart = (productId: string) => cart.items.find((i) => i.productId === productId)?.quantity ?? 0;

  async function changeQuantity(productId: string, quantity: number, replaceCart = false) {
    setBusyId(productId);
    setError(null);
    try {
      if (quantity <= 0) await removeItem(productId);
      else await setItem(productId, quantity, replaceCart);
      setPendingSwap(null);
    } catch (err) {
      if (getErrorCode(err) === "CART_BRANCH_CONFLICT") {
        setPendingSwap({ productId, quantity });
      } else {
        setError(getErrorMessage(err, "Couldn't update your cart."));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (branchError) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-danger mb-4">{branchError}</p>
        <Link to="/browse" className="text-sm font-medium text-primary">
          ← All places
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to="/browse" className="text-sm font-medium text-primary">
        ← All places
      </Link>

      <div className="mt-3 mb-6 min-h-[3.5rem]">
        {branch && (
          <>
            <h1 className="font-display text-2xl font-semibold text-ink">{branch.merchantName}</h1>
            <p className="text-sm text-muted">
              {branch.name} · {branch.address}
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      {pendingSwap && (
        <Card className="mb-4 border-accent">
          <p className="text-sm text-ink mb-3">
            Your cart has items from {cart.branch?.name ?? "another branch"}. An order can only come from one
            branch, so adding this will empty your current cart.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => changeQuantity(pendingSwap.productId, pendingSwap.quantity, true)}>
              Start a new cart
            </Button>
            <Button variant="ghost" onClick={() => setPendingSwap(null)}>
              Keep my cart
            </Button>
          </div>
        </Card>
      )}

      {result && result.total === 0 && <p className="text-sm text-muted">Nothing on the menu right now.</p>}

      <div className="flex flex-col gap-3">
        {result?.items.map((product) => {
          const qty = quantityInCart(product.id);
          const busy = busyId === product.id;
          return (
            <Card key={product.id} className="border-l-4 border-l-primary flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-ink">{product.name}</h3>
                <p className="font-display font-semibold text-ink">{formatPeso(product.price)}</p>
              </div>
              {qty === 0 ? (
                <Button disabled={busy} onClick={() => changeQuantity(product.id, 1)}>
                  {busy ? "Adding…" : "Add to cart"}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    aria-label={`Remove one ${product.name}`}
                    disabled={busy}
                    onClick={() => changeQuantity(product.id, qty - 1)}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm font-medium" aria-live="polite">
                    {qty}
                  </span>
                  <Button
                    variant="ghost"
                    aria-label={`Add one more ${product.name}`}
                    disabled={busy || qty >= MAX_QTY}
                    onClick={() => changeQuantity(product.id, qty + 1)}
                  >
                    +
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {result && (
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
      )}

      <CartBar />
    </div>
  );
}
