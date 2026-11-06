import type { OrderStatus } from "@delivery/shared-types";
import { useState } from "react";
import { getErrorMessage } from "../lib/api";
import { actionLabel, isDestructive } from "../lib/status";
import { Button } from "./Button";

interface OrderActionsProps {
  orderNumber: string;
  /** Straight from the API: what this admin may do next. The UI never decides this itself. */
  allowed: OrderStatus[];
  /** Performs the change; should throw on failure. */
  onChange: (status: OrderStatus) => Promise<void>;
  onError: (message: string) => void;
}

export function OrderActions({ orderNumber, allowed, onChange, onError }: OrderActionsProps) {
  const [busy, setBusy] = useState<OrderStatus | null>(null);

  if (allowed.length === 0) return null;

  async function run(status: OrderStatus) {
    const label = actionLabel[status] ?? status;
    if (isDestructive(status) && !window.confirm(`${label} for ${orderNumber}? This can't be undone.`)) return;
    setBusy(status);
    try {
      await onChange(status);
    } catch (err) {
      onError(getErrorMessage(err, "Couldn't update the order."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allowed.map((status) => (
        <Button
          key={status}
          variant={isDestructive(status) ? "ghost" : "primary"}
          disabled={busy !== null}
          onClick={() => run(status)}
        >
          {busy === status ? "Working…" : (actionLabel[status] ?? status)}
        </Button>
      ))}
    </div>
  );
}
