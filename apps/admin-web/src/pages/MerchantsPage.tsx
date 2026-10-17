import type { Merchant, MerchantStatus, Page } from "@delivery/shared-types";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Pagination } from "../components/Pagination";
import { api, getErrorMessage } from "../lib/api";

const PAGE_SIZE = 10;

const statusBorder: Record<MerchantStatus, string> = {
  PENDING_APPROVAL: "border-l-accent",
  APPROVED: "border-l-primary",
  SUSPENDED: "border-l-danger",
  REJECTED: "border-l-danger",
};

const filters: { label: string; value: MerchantStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING_APPROVAL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Suspended", value: "SUSPENDED" },
];

export function MerchantsPage() {
  const [result, setResult] = useState<Page<Merchant> | null>(null);
  const [filter, setFilter] = useState<MerchantStatus | "ALL">("PENDING_APPROVAL");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function loadMerchants() {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Page<Merchant>>("/merchants", {
        params: { page, pageSize: PAGE_SIZE, ...(filter === "ALL" ? {} : { status: filter }) },
      });
      // Approving the last item on a later page leaves that page empty: step back one page.
      if (data.items.length === 0 && data.page > 1) {
        setPage(data.page - 1);
        return;
      }
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load merchants."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMerchants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  function changeFilter(next: MerchantStatus | "ALL") {
    setFilter(next);
    setPage(1);
  }

  async function handleApprove(merchantId: string) {
    setApprovingId(merchantId);
    setError(null);
    try {
      await api.patch(`/merchants/${merchantId}/approve`);
      await loadMerchants();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't approve this merchant."));
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Merchants</h1>
      <p className="text-sm text-muted mb-6">Review applications and manage merchant status.</p>

      <div className="flex gap-2 mb-6">
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

      {result && result.total === 0 && <p className="text-sm text-muted">No merchants in this view.</p>}

      <div className="flex flex-col gap-3">
        {result?.items.map((merchant) => (
          <Card
            key={merchant.id}
            className={`border-l-4 ${statusBorder[merchant.status]} flex items-center justify-between`}
          >
            <div>
              <h3 className="font-medium text-ink">{merchant.businessName}</h3>
              <p className="text-sm text-muted">
                {merchant.status.replace(/_/g, " ").toLowerCase()} · {merchant.branchCount} branch
                {merchant.branchCount === 1 ? "" : "es"}
              </p>
            </div>
            {merchant.status === "PENDING_APPROVAL" && (
              <Button onClick={() => handleApprove(merchant.id)} disabled={approvingId === merchant.id}>
                {approvingId === merchant.id ? "Approving…" : "Approve"}
              </Button>
            )}
          </Card>
        ))}
      </div>

      {result && (
        <Pagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
