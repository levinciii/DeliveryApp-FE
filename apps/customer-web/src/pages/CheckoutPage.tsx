import type { Address, OrderDetail, Quote } from "@delivery/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { useCart } from "../context/CartContext";
import { api, getErrorCode, getErrorMessage } from "../lib/api";
import { formatPeso } from "../lib/format";

export function CheckoutPage() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<Address[]>("/addresses")
      .then(({ data }) => {
        setAddresses(data);
        setAddressId((current) => current ?? data[0]?.id ?? null);
        setShowForm(data.length === 0);
      })
      .catch((err) => setError(getErrorMessage(err, "Couldn't load your addresses.")));
  }, []);

  // Re-price whenever the address (or the cart) changes.
  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!addressId || cart.items.length === 0) return;
    let stale = false;
    api
      .post<Quote>("/orders/quote", { addressId })
      .then(({ data }) => !stale && setQuote(data))
      .catch((err) => !stale && setQuoteError(getErrorMessage(err, "Couldn't price this order.")));
    return () => {
      stale = true;
    };
  }, [addressId, cart]);

  function fillFromLocation() {
    setFormError(null);
    if (!navigator.geolocation) {
      setFormError("Your browser can't share its location. Type the coordinates instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setFormError("Couldn't get your location. Type the coordinates instead."),
    );
  }

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (lat.trim() === "" || lng.trim() === "" || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setFormError("Enter the latitude and longitude, or use your current location.");
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await api.post<Address>("/addresses", {
        ...(label.trim() ? { label: label.trim() } : {}),
        address: street,
        latitude,
        longitude,
      });
      setAddresses((list) => [...(list ?? []), data]);
      setAddressId(data.id);
      setShowForm(false);
      setLabel("");
      setStreet("");
      setLat("");
      setLng("");
    } catch (err) {
      setFormError(getErrorMessage(err, "Couldn't save the address."));
    } finally {
      setIsSaving(false);
    }
  }

  async function placeOrder() {
    if (!addressId) return;
    setIsPlacing(true);
    setError(null);
    try {
      const { data } = await api.post<OrderDetail>("/orders", {
        addressId,
        paymentMethod: "COD",
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      await refresh();
      navigate(`/orders/${data.id}`, { replace: true });
    } catch (err) {
      const code = getErrorCode(err);
      setError(
        code === "CART_ITEMS_UNAVAILABLE" || code === "CART_BRANCH_CONFLICT"
          ? `${getErrorMessage(err, "Your cart needs attention.")} Review your cart and try again.`
          : getErrorMessage(err, "Couldn't place your order."),
      );
      refresh().catch(() => {});
    } finally {
      setIsPlacing(false);
    }
  }

  if (cart.items.length === 0 && !isPlacing) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">Checkout</h1>
        <p className="text-sm text-muted mb-4">Your cart is empty.</p>
        <Link to="/browse" className="text-sm font-medium text-primary">
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Checkout</h1>
      <p className="text-sm text-muted mb-6">
        {cart.itemCount} items from {cart.branch?.name} ·{" "}
        <Link to="/cart" className="text-primary font-medium">
          Edit cart
        </Link>
      </p>

      <h2 className="font-display text-lg font-semibold text-ink mb-3">Delivery address</h2>
      <div className="flex flex-col gap-3 mb-4">
        {addresses?.map((a) => (
          <label key={a.id} className="cursor-pointer">
            <Card className={`flex items-start gap-3 ${a.id === addressId ? "border-primary" : ""}`}>
              <input
                type="radio"
                name="address"
                className="mt-1"
                checked={a.id === addressId}
                onChange={() => setAddressId(a.id)}
              />
              <div>
                <p className="font-medium text-ink">{a.label ?? "Address"}</p>
                <p className="text-sm text-muted">{a.address}</p>
              </div>
            </Card>
          </label>
        ))}
      </div>

      {showForm ? (
        <Card className="mb-6">
          <form onSubmit={saveAddress} className="flex flex-col gap-4">
            <Input label="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home" />
            <Input label="Street address" value={street} onChange={(e) => setStreet(e.target.value)} required />
            <div className="flex gap-3">
              <div className="flex-1">
                <Input label="Latitude" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="14.8494" />
              </div>
              <div className="flex-1">
                <Input label="Longitude" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="120.2827" />
              </div>
            </div>
            <div>
              <Button type="button" variant="ghost" onClick={fillFromLocation}>
                Use my current location
              </Button>
              <p className="text-xs text-muted mt-2">
                There's no map yet, so the delivery fee uses these coordinates.
              </p>
            </div>
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save address"}
              </Button>
              {addresses && addresses.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="ghost" className="mb-6" onClick={() => setShowForm(true)}>
          Add a new address
        </Button>
      )}

      <h2 className="font-display text-lg font-semibold text-ink mb-3">Order summary</h2>
      <Card className="mb-6">
        <ul className="flex flex-col gap-1 mb-4">
          {cart.items.map((line) => (
            <li key={line.productId} className="flex justify-between text-sm">
              <span className="text-ink">
                {line.quantity} × {line.name}
              </span>
              <span className="text-muted">{formatPeso(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="border-t border-ink/10 pt-3 flex flex-col gap-1 text-sm">
          <Row label="Subtotal" value={formatPeso(quote?.subtotal ?? cart.subtotal)} />
          <Row label={quote ? `Delivery (${quote.distanceKm} km)` : "Delivery"} value={quote ? formatPeso(quote.deliveryFee) : "—"} />
          <Row label="Service fee" value={quote ? formatPeso(quote.serviceFee) : "—"} />
          <div className="flex justify-between font-display font-semibold text-ink text-base pt-2">
            <dt>Total</dt>
            <dd>{quote ? formatPeso(quote.total) : "—"}</dd>
          </div>
        </dl>
        {quoteError && <p className="text-sm text-danger mt-3">{quoteError}</p>}
        {!addressId && !showForm && <p className="text-sm text-muted mt-3">Choose an address to see the total.</p>}
      </Card>

      <Input label="Note for the merchant (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} />

      <p className="text-sm text-muted mt-4 mb-4">
        Payment: <span className="text-ink font-medium">Cash on delivery</span>. You pay the rider when your order arrives.
      </p>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <Button onClick={placeOrder} disabled={!quote || isPlacing} className="w-full">
        {isPlacing ? "Placing order…" : quote ? `Place order · ${formatPeso(quote.total)}` : "Place order"}
      </Button>
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
