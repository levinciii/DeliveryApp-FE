import type { BranchSummary, Page } from "@delivery/shared-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Pagination } from "../components/Pagination";
import { api, getErrorMessage } from "../lib/api";

const PAGE_SIZE = 12;
const SEARCH_DELAY_MS = 300;

export function BrowsePage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page<BranchSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let stale = false;
    setIsLoading(true);
    api
      .get<Page<BranchSummary>>("/branches", {
        params: { page, pageSize: PAGE_SIZE, ...(search ? { search } : {}) },
      })
      .then(({ data }) => {
        if (stale) return;
        setResult(data);
        setError(null);
      })
      .catch((err) => !stale && setError(getErrorMessage(err, "Couldn't load places.")))
      .finally(() => !stale && setIsLoading(false));
    return () => {
      stale = true;
    };
  }, [page, search]);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Order from</h1>
      <p className="text-sm text-muted mb-6">Pick a place to see its menu.</p>

      <div className="max-w-md mb-8">
        <label htmlFor="place-search" className="sr-only">
          Search places
        </label>
        <input
          id="place-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by restaurant or branch name"
          className="w-full rounded-md border border-ink/15 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {isLoading && !result && <p className="text-sm text-muted">Loading…</p>}

      {result && result.total === 0 && (
        <p className="text-sm text-muted">
          {search
            ? `No places match "${search}".`
            : "No places are open for orders yet. Check back soon."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result?.items.map((branch) => (
          <Link key={branch.id} to={`/browse/${branch.id}`} className="block">
            <Card className="h-full hover:border-primary transition-colors">
              <div className="flex items-start gap-3">
                <div
                  aria-hidden="true"
                  className="shrink-0 w-10 h-10 rounded-md bg-primary/10 text-primary font-display font-semibold flex items-center justify-center"
                >
                  {branch.merchantName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-semibold text-ink leading-tight">{branch.merchantName}</h2>
                  <p className="text-sm text-muted">{branch.name}</p>
                </div>
              </div>
              <p className="text-sm text-muted mt-3 line-clamp-2">{branch.address}</p>
              <p className="text-sm text-ink mt-3">
                {branch.productCount} item{branch.productCount === 1 ? "" : "s"} on the menu
              </p>
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
