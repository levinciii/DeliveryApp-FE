import type { Page, Product } from "@delivery/shared-types";
import { FormEvent, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Pagination } from "../components/Pagination";
import { api, getErrorMessage } from "../lib/api";
import { formatPeso } from "../lib/format";

const PAGE_SIZE = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function BrowsePage() {
  const [branchInput, setBranchInput] = useState("");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [result, setResult] = useState<Page<Product> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function load(id: string, page: number) {
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await api.get<Page<Product>>("/products", {
        params: { branchId: id, page, pageSize: PAGE_SIZE },
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(getErrorMessage(err, "Couldn't load products."));
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = branchInput.trim();
    if (!UUID.test(id)) {
      setResult(null);
      setError("That doesn't look like a branch ID. Branch IDs are UUIDs, like 3b1b8f2a-….");
      return;
    }
    setBranchId(id);
    load(id, 1);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Browse products</h1>
      <p className="text-sm text-muted mb-6">
        There's no merchant directory yet — paste a branch ID to see its catalog.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3 items-end mb-8">
        <div className="flex-1">
          <Input
            label="Branch ID"
            value={branchInput}
            onChange={(e) => setBranchInput(e.target.value)}
            placeholder="e.g. 3b1b8f2a-..."
            required
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      {result && result.total === 0 && (
        <p className="text-sm text-muted">
          No products to show. The branch may not be approved yet, or it has no active products.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {result?.items.map((product) => (
          <Card key={product.id} className="border-l-4 border-l-primary flex items-center justify-between">
            <h3 className="font-medium text-ink">{product.name}</h3>
            <p className="font-display font-semibold text-ink">{formatPeso(product.price)}</p>
          </Card>
        ))}
      </div>

      {result && branchId && (
        <Pagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          onPageChange={(page) => load(branchId, page)}
        />
      )}
    </div>
  );
}
